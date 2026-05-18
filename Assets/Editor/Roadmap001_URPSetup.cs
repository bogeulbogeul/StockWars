using UnityEditor;
using UnityEngine;

namespace StockWars.EditorScripts
{
    public class Roadmap001_URPSetup
    {
        [MenuItem("Tools/StockWars/001. Initialize URP Pipeline")]
        public static void SetupURP()
        {
            // 1. Settings 폴더 생성
            string folderPath = "Assets/Settings";
            if (!AssetDatabase.IsValidFolder(folderPath))
            {
                AssetDatabase.CreateFolder("Assets", "Settings");
                Debug.Log($"[StockWars] Created folder: {folderPath}");
            }

            // 2. Graphics Settings 창 열기
            SettingsService.OpenProjectSettings("Project/Graphics");

            // 3. 사용자 안내 모달 표시
            string message = 
                "URP 초기화 자동화 스크립트가 실행되었습니다!\n\n" +
                "1. Project 창에서 Assets/Settings 폴더로 이동하세요.\n" +
                "2. 우클릭 -> Create -> Rendering -> URP Asset (with Universal Renderer) 을 생성하세요.\n" +
                "3. 방금 열린 Graphics 설정 창의 최상단 'Scriptable Render Pipeline Settings' 란에 생성한 에셋을 드래그 앤 드롭하세요.\n\n" +
                "할당이 완료되면 로드맵 1번이 끝납니다!";
                
            EditorUtility.DisplayDialog("Step 001. URP Setup Guide", message, "확인");
        }
    }
}
