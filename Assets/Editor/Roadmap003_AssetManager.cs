using UnityEditor;
using UnityEngine;

namespace StockWars.EditorScripts
{
    public class Roadmap003_AssetManager : AssetPostprocessor
    {
        // 1. 대규모 텍스처(UI) 임포트 자동 최적화
        void OnPreprocessTexture()
        {
            TextureImporter importer = (TextureImporter)assetImporter;
            
            // UI 폴더에 들어오는 이미지는 압축을 방지하고 퀄리티를 유지
            if (importer.assetPath.Contains("Art/UI"))
            {
                importer.mipmapEnabled = false;
                
                // 파일 이름이나 경로에 "cursor" 혹은 흔히 발생하는 오타인 "cusor"가 포함된 경우 강제 변경을 생략합니다.
                bool isCursorFile = importer.assetPath.ToLower().Contains("cursor") || importer.assetPath.ToLower().Contains("cusor");
                if (!isCursorFile && importer.textureType != TextureImporterType.Cursor)
                {
                    importer.textureType = TextureImporterType.Sprite;
                }
            }
        }

        // 2. 대규모 사운드 임포트 자동 최적화
        void OnPreprocessAudio()
        {
            AudioImporter importer = (AudioImporter)assetImporter;
            
            // BGM은 용량이 크므로 메모리 점유를 막기 위해 Streaming으로 강제 설정
            if (importer.assetPath.Contains("Audio/BGM"))
            {
                AudioImporterSampleSettings settings = importer.defaultSampleSettings;
                settings.loadType = AudioClipLoadType.Streaming;
                settings.compressionFormat = AudioCompressionFormat.Vorbis;
                settings.quality = 0.7f; // 70% 퀄리티로 압축
                importer.defaultSampleSettings = settings;
            }
            // SFX는 짧고 빠른 반응이 필요하므로 DecompressOnLoad로 설정
            else if (importer.assetPath.Contains("Audio/SFX"))
            {
                AudioImporterSampleSettings settings = importer.defaultSampleSettings;
                settings.loadType = AudioClipLoadType.DecompressOnLoad;
                settings.compressionFormat = AudioCompressionFormat.ADPCM;
                importer.defaultSampleSettings = settings;
            }
        }
    }
}
