import { memo, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';

export const EquipmentAsset = memo(function EquipmentAsset({
  name,
  active = false,
  quality = 'medium',
}: {
  name: string;
  active?: boolean;
  quality?: string;
}) {
  const { scene } = useGLTF(`/models/${name}${quality === 'low' ? '-low' : ''}.glb`);
  const instance = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const source = object.material as MeshStandardMaterial;
      object.material = source.clone();
      if (quality === 'low') {
        const finish = new MeshStandardMaterial({
          name: source.name,
          color: source.color,
          metalness: Math.min(source.metalness, 0.25),
          roughness: 0.5,
          ...(source.name === 'borosilicate-glass'
            ? { transparent: true, opacity: 0.17, depthWrite: false }
            : {}),
        });
        (object.material as MeshStandardMaterial).dispose();
        object.material = finish;
      }
      if (source.name === 'borosilicate-glass') object.castShadow = false;
    });
    return copy;
  }, [scene, quality]);
  useEffect(() => {
    instance.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const material = object.material as MeshPhysicalMaterial;
      if (material.name === 'heater-element') {
        material.emissive.set(active ? '#ff780c' : '#000000');
        material.emissiveIntensity = active ? 0.7 : 0;
      }
      if (material.name === 'power-led') {
        material.emissive.set(active ? '#00bb70' : '#000000');
        material.emissiveIntensity = active ? 1.5 : 0;
      }
      if (material.name === 'borosilicate-glass') {
        material.transmission = quality === 'low' ? 0 : 0.96;
        material.transparent = true;
        material.opacity = quality === 'low' ? 0.17 : 1;
        material.depthWrite = false;
      }
    });
  }, [instance, active, quality]);
  useEffect(
    () => () => {
      instance.traverse((object) => {
        if (object instanceof Mesh) (object.material as MeshStandardMaterial).dispose();
      });
    },
    [instance],
  );
  return <primitive object={instance} />;
});
