import * as THREE from 'three';

export interface FolioPlacement {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

/**
 * Places an object-attached folio beside its exhibit rather than in front of the
 * learner. The panel is 0.6 m from the exhibit, offset to its right, and is
 * raised enough to avoid the floor. Its orientation is calculated once when it
 * opens; it deliberately does not follow head movement.
 */
export function placeFolioBesideExhibit(
  exhibitWorldPosition: THREE.Vector3,
  viewerWorldPosition: THREE.Vector3,
  roomBounds?: THREE.Box3,
): FolioPlacement {
  const fromExhibitToViewer = viewerWorldPosition.clone().sub(exhibitWorldPosition).setY(0);
  if (fromExhibitToViewer.lengthSq() < 0.0001) fromExhibitToViewer.set(0, 0, 1);
  fromExhibitToViewer.normalize();

  const side = new THREE.Vector3(-fromExhibitToViewer.z, 0, fromExhibitToViewer.x);
  const position = exhibitWorldPosition.clone()
    .addScaledVector(fromExhibitToViewer, 0.5)
    .addScaledVector(side, 0.32);
  position.y = Math.max(1.0, Math.min(1.6, exhibitWorldPosition.y + 0.2));

  if (roomBounds) {
    roomBounds.clampPoint(position, position);
  }

  return {
    position,
    lookAt: new THREE.Vector3(viewerWorldPosition.x, position.y, viewerWorldPosition.z),
  };
}
