# T-pose spirit rig

User-directed experimental 3D workflow. Not installed into the game.

- Source: user supplied Meshy_AI_Blank_Buddy_1018040345_generate.glb; original retained in sibling spirit-rigid-rig-v1/source.blend.
- Imported head retained with lower neck trimmed. Simple torso/limbs rebuilt as rounded volumes to avoid cut-surface tears during rigid rotations. This changes body geometry from the Meshy original.
- Rest skeleton is T-pose. Bones: Root, Body, Arm_L, Arm_R, Leg_L, Leg_R. No elbow/knee bones. Each mesh vertex has exactly one weight of 1, so limbs cannot stretch or bend internally.
- Actions: Tpose, Idle, Walk, Wave, Eat. Walk is an in-place prototype, not production foot-contact tuning. Eat is a reach demonstration; the orange prop appears in Blender preview only. No face or mouth position has been finalized.
- buddy-tpose.blend: editable scene, actions and optional Food_demo_prop. Select Buddy_Rigid_Rig and switch action in Action Editor; all NLA tracks are muted to avoid action stacking.
- buddy-tpose.glb: skin and five animation clips, body-only export. Reimport verified in validation.json.
- Walk/GIF previews are rendered from the actual rig, not AI pose images. Pairwise limb distances and one-bone weights checked in several frames for each motion.
