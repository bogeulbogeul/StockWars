using UnityEngine;
using UnityEditor;

namespace StockWars.Editor
{
    /// <summary>
    /// Assets/Sprites/Environment/ground_9slice_atlas.png 이미지를
    /// 자동으로 Sprite Mode Multiple로 설정하고 ground_left, ground_mid, ground_right 3개 스프라이트로 슬라이스해주는 에디터 툴
    /// </summary>
    public static class SliceGroundSprite
    {
        [MenuItem("StockWars/Process Ground Atlas Sprite", false, 20)]
        public static void SliceAtlas()
        {
            string assetPath = "Assets/Sprites/Environment/ground_9slice_atlas.png";
            TextureImporter importer = AssetImporter.GetAtPath(assetPath) as TextureImporter;

            if (importer == null)
            {
                Debug.LogError($"[StockWars Editor] 에셋을 찾을 수 없습니다: {assetPath}");
                return;
            }

            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Multiple;
            importer.filterMode = FilterMode.Bilinear;
            importer.alphaIsTransparency = true;

            // 텍스처 메타데이터 자동 슬라이싱
            Texture2D tex = AssetDatabase.LoadAssetAtPath<Texture2D>(assetPath);
            if (tex != null)
            {
                int w = tex.width;
                int h = tex.height;
                int pieceW = w / 3;

                SpriteMetaData[] metaData = new SpriteMetaData[3];

                metaData[0] = new SpriteMetaData
                {
                    name = "ground_left",
                    rect = new Rect(0, 0, pieceW, h),
                    pivot = new Vector2(0.5f, 0.5f),
                    alignment = (int)SpriteAlignment.Center
                };

                metaData[1] = new SpriteMetaData
                {
                    name = "ground_mid",
                    rect = new Rect(pieceW, 0, pieceW, h),
                    pivot = new Vector2(0.5f, 0.5f),
                    alignment = (int)SpriteAlignment.Center
                };

                metaData[2] = new SpriteMetaData
                {
                    name = "ground_right",
                    rect = new Rect(pieceW * 2, 0, w - pieceW * 2, h),
                    pivot = new Vector2(0.5f, 0.5f),
                    alignment = (int)SpriteAlignment.Center
                };

                importer.spritesheet = metaData;
            }

            EditorUtility.SetDirty(importer);
            importer.SaveAndReimport();
            AssetDatabase.Refresh();

            Debug.Log("<color=#4CAF50><b>[StockWars Editor]</b></color> ground_9slice_atlas.png가 성공적으로 ground_left, ground_mid, ground_right 3개의 스프라이트로 슬라이스되었습니다!");
        }
    }
}
