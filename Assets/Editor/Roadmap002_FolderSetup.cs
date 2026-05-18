using UnityEditor;
using UnityEngine;
using System.IO;

namespace StockWars.EditorScripts
{
    public class Roadmap002_FolderSetup
    {
        [InitializeOnLoadMethod]
        public static void GenerateFoldersOnLoad()
        {
            if (SessionState.GetBool("Roadmap002_Done", false)) return;
            SessionState.SetBool("Roadmap002_Done", true);

            string[] folders = new string[]
            {
                "Art", "Art/Materials", "Art/Models", "Art/Textures", "Art/UI", "Art/Animations",
                "Audio", "Audio/BGM", "Audio/SFX",
                "Data", "Data/Resources", "Data/ScriptableObjects", "Data/SaveData",
                "Modules", "Modules/Core", "Modules/UI", "Modules/Network",
                "Managers",
                "Prefabs", "Prefabs/UI", "Prefabs/Entities",
                "Scenes", "Scripts", "Scripts/Core", "Scripts/UI", "Scripts/Utils", 
                "Settings"
            };

            bool createdAny = false;
            foreach (string folder in folders)
            {
                string path = Path.Combine(Application.dataPath, folder);
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                    createdAny = true;
                }
            }
            
            if (createdAny)
            {
                AssetDatabase.Refresh();
                Debug.Log("[StockWars] 002번 로드맵 완료: 표준 폴더 아키텍처가 자동 생성되었습니다.");
            }
        }
    }
}
