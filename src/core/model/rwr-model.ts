import type {
  BindingGroup,
  EditorSnapshot,
  RwrAnimation,
  SkeletonParticle,
  SkeletonStick,
  Vec3,
  Voxel,
} from '../types';

const serializer = new XMLSerializer();

function directChild(parent: Element, tagName: string): Element | null {
  return Array.from(parent.children).find((node) => node.tagName === tagName) ?? null;
}

function numberAttr(element: Element, name: string, fallback = 0): number {
  const raw = element.getAttribute(name);
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function intAttr(element: Element, name: string, fallback = 0): number {
  const value = Number.parseInt(element.getAttribute(name) ?? '', 10);
  return Number.isFinite(value) ? value : fallback;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

function cloneVoxel(voxel: Voxel): Voxel {
  return { ...voxel };
}

export class RwrModel {
  readonly sourceText: string;
  readonly document: XMLDocument;
  readonly root: Element;
  readonly skeleton: SkeletonParticle[] = [];
  readonly sticks: SkeletonStick[] = [];
  voxels: Voxel[] = [];
  bindings: BindingGroup[] = [];
  dirty = false;
  private nextId = 1;

  private constructor(sourceText: string, document: XMLDocument, root: Element) {
    this.sourceText = sourceText;
    this.document = document;
    this.root = root;
  }

  static parse(text: string): RwrModel {
    const document = new DOMParser().parseFromString(text, 'application/xml');
    const parserError = document.querySelector('parsererror');
    if (parserError) throw new Error(`XML 解析失败：${parserError.textContent?.trim() ?? '未知错误'}`);
    const root = document.documentElement;
    if (!root || root.tagName !== 'model') throw new Error('文件根节点不是 <model>。');
    const voxelsElement = directChild(root, 'voxels');
    if (!voxelsElement) throw new Error('模型中缺少 <voxels>。');

    const model = new RwrModel(text, document, root);
    const voxelElements = Array.from(voxelsElement.children).filter((node) => node.tagName === 'voxel');
    model.voxels = voxelElements.map((node, index) => ({
      id: `v${model.nextId++}`,
      sourceIndex: index,
      x: numberAttr(node, 'x'),
      y: numberAttr(node, 'y'),
      z: numberAttr(node, 'z'),
      r: numberAttr(node, 'r', 1),
      g: numberAttr(node, 'g', 1),
      b: numberAttr(node, 'b', 1),
      a: numberAttr(node, 'a', 1),
    }));

    const skeletonElement = directChild(root, 'skeleton');
    if (skeletonElement) {
      for (const node of Array.from(skeletonElement.children)) {
        if (node.tagName === 'particle') {
          model.skeleton.push({
            id: node.getAttribute('id') ?? String(model.skeleton.length),
            name: node.getAttribute('name') ?? `骨骼点 ${model.skeleton.length + 1}`,
            x: numberAttr(node, 'x'),
            y: numberAttr(node, 'y'),
            z: numberAttr(node, 'z'),
            invMass: numberAttr(node, 'invMass'),
            bodyAreaHint: intAttr(node, 'bodyAreaHint'),
          });
        } else if (node.tagName === 'stick') {
          model.sticks.push({ a: node.getAttribute('a') ?? '', b: node.getAttribute('b') ?? '' });
        }
      }
    }

    const bindingsElement = directChild(root, 'skeletonVoxelBindings');
    if (bindingsElement) {
      for (const groupElement of Array.from(bindingsElement.children).filter(
        (node) => node.tagName === 'group',
      )) {
        const ids = new Set<string>();
        for (const ref of Array.from(groupElement.children).filter((node) => node.tagName === 'voxel')) {
          const index = intAttr(ref, 'index', -1);
          const voxel = model.voxels[index];
          if (voxel) ids.add(voxel.id);
        }
        model.bindings.push({ constraintIndex: intAttr(groupElement, 'constraintIndex'), voxelIds: ids });
      }
    }
    return model;
  }

  static createNew(baseVoxels: 1 | 8): RwrModel {
    const positions: Vec3[] =
      baseVoxels === 1
        ? [{ x: 0, y: 0, z: 0 }]
        : [0, 1].flatMap((x) => [0, 1].flatMap((y) => [0, 1].map((z) => ({ x, y, z }))));
    const voxels = positions
      .map(
        ({ x, y, z }) =>
          `    <voxel x="${x}" y="${y}" z="${z}" r="0.450980" g="0.549020" b="0.270588" a="1.000000"/>`,
      )
      .join('\n');
    return RwrModel.parse(
      `<?xml version="1.0" encoding="UTF-8"?>\n<model>\n  <voxels>\n${voxels}\n  </voxels>\n  <skeleton/>\n  <skeletonVoxelBindings/>\n</model>`,
    );
  }

  get bounds(): { min: Vec3; max: Vec3; center: Vec3 } {
    if (this.voxels.length === 0) {
      return { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 }, center: { x: 0, y: 0, z: 0 } };
    }
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (const voxel of this.voxels) {
      min.x = Math.min(min.x, voxel.x);
      min.y = Math.min(min.y, voxel.y);
      min.z = Math.min(min.z, voxel.z);
      max.x = Math.max(max.x, voxel.x);
      max.y = Math.max(max.y, voxel.y);
      max.z = Math.max(max.z, voxel.z);
    }
    return {
      min,
      max,
      center: { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 },
    };
  }

  snapshot(): EditorSnapshot {
    return {
      voxels: this.voxels.map(cloneVoxel),
      bindings: this.bindings.map((group) => ({
        constraintIndex: group.constraintIndex,
        voxelIds: [...group.voxelIds],
      })),
    };
  }

  restore(snapshot: EditorSnapshot): void {
    this.voxels = snapshot.voxels.map(cloneVoxel);
    this.bindings = snapshot.bindings.map((group) => ({
      constraintIndex: group.constraintIndex,
      voxelIds: new Set(group.voxelIds),
    }));
    this.dirty = true;
  }

  hasVoxelAt(x: number, y: number, z: number, excluding = new Set<string>()): boolean {
    return this.voxels.some(
      (voxel) => !excluding.has(voxel.id) && voxel.x === x && voxel.y === y && voxel.z === z,
    );
  }

  addVoxel(position: Vec3, color: { r: number; g: number; b: number; a?: number }): Voxel | null {
    if (this.hasVoxelAt(position.x, position.y, position.z)) return null;
    const voxel: Voxel = {
      id: `v${this.nextId++}`,
      sourceIndex: null,
      ...position,
      r: color.r,
      g: color.g,
      b: color.b,
      a: color.a ?? 1,
    };
    this.voxels.push(voxel);
    this.dirty = true;
    return voxel;
  }

  remove(ids: Set<string>): number {
    const before = this.voxels.length;
    this.voxels = this.voxels.filter((voxel) => !ids.has(voxel.id));
    for (const group of this.bindings) {
      for (const id of ids) group.voxelIds.delete(id);
    }
    const removed = before - this.voxels.length;
    if (removed) this.dirty = true;
    return removed;
  }

  move(ids: Set<string>, delta: Vec3): boolean {
    const selected = this.voxels.filter((voxel) => ids.has(voxel.id));
    if (!selected.length) return false;
    for (const voxel of selected) {
      if (this.hasVoxelAt(voxel.x + delta.x, voxel.y + delta.y, voxel.z + delta.z, ids)) return false;
    }
    for (const voxel of selected) {
      voxel.x += delta.x;
      voxel.y += delta.y;
      voxel.z += delta.z;
    }
    this.dirty = true;
    return true;
  }

  paint(ids: Set<string>, color: { r: number; g: number; b: number }): number {
    let count = 0;
    for (const voxel of this.voxels) {
      if (!ids.has(voxel.id)) continue;
      voxel.r = color.r;
      voxel.g = color.g;
      voxel.b = color.b;
      count += 1;
    }
    if (count) this.dirty = true;
    return count;
  }

  rebindSkeleton(): number {
    if (!this.skeleton.length || !this.sticks.length) return 0;
    const particles = new Map(this.skeleton.map((particle) => [particle.id, particle]));
    this.bindings = this.sticks.map((_, constraintIndex) => ({
      constraintIndex,
      voxelIds: new Set<string>(),
    }));
    for (const voxel of this.voxels) {
      let bestIndex = 0;
      let bestDistance = Infinity;
      this.sticks.forEach((stick, index) => {
        const a = particles.get(stick.a);
        const b = particles.get(stick.b);
        if (!a || !b) return;
        const distance = pointSegmentDistanceSquared(voxel, a, b);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      this.bindings[bestIndex]?.voxelIds.add(voxel.id);
    }
    this.dirty = true;
    return this.voxels.length;
  }

  serialize(): string {
    const clone = this.document.cloneNode(true) as XMLDocument;
    const root = clone.documentElement;
    const voxelsElement = directChild(root, 'voxels');
    if (!voxelsElement) throw new Error('无法导出：缺少 <voxels>。');
    voxelsElement.replaceChildren();
    this.voxels.forEach((voxel) => {
      const node = clone.createElement('voxel');
      node.setAttribute('x', formatNumber(voxel.x));
      node.setAttribute('y', formatNumber(voxel.y));
      node.setAttribute('z', formatNumber(voxel.z));
      node.setAttribute('r', voxel.r.toFixed(6));
      node.setAttribute('g', voxel.g.toFixed(6));
      node.setAttribute('b', voxel.b.toFixed(6));
      node.setAttribute('a', voxel.a.toFixed(6));
      voxelsElement.appendChild(node);
    });

    let bindingsElement = directChild(root, 'skeletonVoxelBindings');
    if (this.bindings.length && !bindingsElement) {
      bindingsElement = clone.createElement('skeletonVoxelBindings');
      root.appendChild(bindingsElement);
    }
    if (bindingsElement) {
      bindingsElement.replaceChildren();
      const indexById = new Map(this.voxels.map((voxel, index) => [voxel.id, index]));
      for (const group of this.bindings) {
        const groupNode = clone.createElement('group');
        groupNode.setAttribute('constraintIndex', String(group.constraintIndex));
        const indexes = [...group.voxelIds]
          .map((id) => indexById.get(id))
          .filter((index): index is number => index !== undefined)
          .sort((a, b) => a - b);
        for (const index of indexes) {
          const ref = clone.createElement('voxel');
          ref.setAttribute('index', String(index));
          groupNode.appendChild(ref);
        }
        bindingsElement.appendChild(groupNode);
      }
    }
    const xml = serializer.serializeToString(clone);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xml.replace(/^<\?xml[^>]*>\s*/, '')}`;
  }
}

function pointSegmentDistanceSquared(point: Vec3, a: Vec3, b: Vec3): number {
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const ap = { x: point.x - a.x, y: point.y - a.y, z: point.z - a.z };
  const denominator = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z;
  const t =
    denominator === 0 ? 0 : Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / denominator));
  const dx = point.x - (a.x + ab.x * t);
  const dy = point.y - (a.y + ab.y * t);
  const dz = point.z - (a.z + ab.z * t);
  return dx * dx + dy * dy + dz * dz;
}

export function parseAnimations(text: string): RwrAnimation[] {
  const document = new DOMParser().parseFromString(text, 'application/xml');
  const parserError = document.querySelector('parsererror');
  if (parserError) throw new Error('动画 XML 解析失败。');
  const animations: RwrAnimation[] = [];
  for (const animation of Array.from(document.documentElement.children).filter(
    (node) => node.tagName === 'animation',
  )) {
    const frames = Array.from(animation.children)
      .filter((node) => node.tagName === 'frame')
      .map((frame) => ({
        time: numberAttr(frame, 'time'),
        positions: Array.from(frame.children)
          .filter((node) => node.tagName === 'position')
          .map((position) => ({
            x: numberAttr(position, 'x'),
            y: numberAttr(position, 'y'),
            z: numberAttr(position, 'z'),
          })),
      }));
    animations.push({
      name: animation.getAttribute('comment') || `动画 ${animations.length + 1}`,
      loop: animation.getAttribute('loop') !== '0',
      end: numberAttr(animation, 'end', frames.at(-1)?.time ?? 0),
      speed: numberAttr(animation, 'speed', 1),
      speedSpread: numberAttr(animation, 'speed_spread', 0),
      frames,
    });
  }
  return animations;
}

export function serializeAnimations(animations: RwrAnimation[]): string {
  const document = documentImplementation().createDocument('', 'animations', null);
  const root = document.documentElement;
  for (const animation of animations) {
    const animationNode = document.createElement('animation');
    animationNode.setAttribute('loop', animation.loop ? '1' : '0');
    animationNode.setAttribute('end', animation.end.toFixed(6));
    animationNode.setAttribute('speed', animation.speed.toFixed(6));
    if (animation.speedSpread !== 0)
      animationNode.setAttribute('speed_spread', animation.speedSpread.toFixed(6));
    animationNode.setAttribute('comment', animation.name);
    for (const frame of [...animation.frames].sort((a, b) => a.time - b.time)) {
      const frameNode = document.createElement('frame');
      frameNode.setAttribute('time', frame.time.toFixed(6));
      for (const position of frame.positions) {
        const positionNode = document.createElement('position');
        positionNode.setAttribute('x', position.x.toFixed(6));
        positionNode.setAttribute('y', position.y.toFixed(6));
        positionNode.setAttribute('z', position.z.toFixed(6));
        frameNode.appendChild(positionNode);
      }
      animationNode.appendChild(frameNode);
    }
    root.appendChild(animationNode);
  }
  const xml = serializer.serializeToString(document);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

function documentImplementation(): DOMImplementation {
  const document = new DOMParser().parseFromString('<root/>', 'application/xml');
  return document.implementation;
}
