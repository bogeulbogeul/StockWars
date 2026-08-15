using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using StockWars.Town;

namespace StockWars.Editor
{
    /// <summary>
    /// Unity Editor 상단 메뉴(StockWars > Setup Town Scene)를 통해
    /// 현재 열려 있는 TownScene에 바닥, 카메라, 배경 패럴랙스 레이어 및 물리 경계를 원클릭으로 세팅해 주는 에디터 툴.
    /// </summary>
    public static class TownSceneSetup
    {
        [MenuItem("StockWars/Setup Town Scene (Ground & Scroller)", false, 10)]
        public static void SetupTownScene()
        {
            // 1. 메인 카메라 세팅
            Camera mainCam = Camera.main;
            if (mainCam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                mainCam = camObj.AddComponent<Camera>();
                camObj.tag = "MainCamera";
            }

            mainCam.orthographic = true;
            mainCam.orthographicSize = 5f;
            mainCam.clearFlags = CameraClearFlags.SolidColor;
            // 따뜻한 크림 베이지 배경색 (#FAEFF0)
            mainCam.backgroundColor = new Color(0.98f, 0.94f, 0.85f);
            mainCam.transform.position = new Vector3(0f, 0f, -10f);

            // TownCameraController 세팅
            TownCameraController camController = mainCam.GetComponent<TownCameraController>();
            if (camController == null)
            {
                camController = mainCam.gameObject.AddComponent<TownCameraController>();
            }
            camController.SetBounds(-12f, 12f);

            // 2. Environment 루트 오브젝트 세팅
            GameObject envRoot = GameObject.Find("[Environment]");
            if (envRoot == null)
            {
                envRoot = new GameObject("[Environment]");
            }

            // 3. 바닥 (Ground) 세팅
            Transform groundTr = envRoot.transform.Find("Ground");
            GameObject groundObj;
            if (groundTr == null)
            {
                groundObj = new GameObject("Ground");
                groundObj.transform.SetParent(envRoot.transform, false);
            }
            else
            {
                groundObj = groundTr.gameObject;
            }

            TownGroundController groundController = groundObj.GetComponent<TownGroundController>();
            if (groundController == null)
            {
                groundController = groundObj.AddComponent<TownGroundController>();
            }
            groundController.SetupGroundVisualsAndPhysics();

            // 4. 원경 패럴랙스 배경 (Background_Far)
            Transform farTr = envRoot.transform.Find("Background_Far");
            GameObject farObj;
            if (farTr == null)
            {
                farObj = new GameObject("Background_Far");
                farObj.transform.SetParent(envRoot.transform, false);
            }
            else
            {
                farObj = farTr.gameObject;
            }
            farObj.transform.position = new Vector3(0f, 1.5f, 5f);

            var farParallax = farObj.GetComponent<BoundedParallaxBackground>();
            if (farParallax == null)
            {
                farParallax = farObj.AddComponent<BoundedParallaxBackground>();
            }
            farParallax.SetParallaxFactor(0.2f);

            // 5. 중경 패럴랙스 배경 (Background_Mid)
            Transform midTr = envRoot.transform.Find("Background_Mid");
            GameObject midObj;
            if (midTr == null)
            {
                midObj = new GameObject("Background_Mid");
                midObj.transform.SetParent(envRoot.transform, false);
            }
            else
            {
                midObj = midTr.gameObject;
            }
            midObj.transform.position = new Vector3(0f, 0f, 2f);

            var midParallax = midObj.GetComponent<BoundedParallaxBackground>();
            if (midParallax == null)
            {
                midParallax = midObj.AddComponent<BoundedParallaxBackground>();
            }
            midParallax.SetParallaxFactor(0.5f);

            // 씬 변경 사항 기록 및 저장 알림
            EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());
            Debug.Log("<color=#4CAF50><b>[StockWars Editor]</b></color> TownScene의 바닥(Ground) 및 양끝 제한 배경 스크롤 시스템 세팅이 완료되었습니다!");
            EditorUtility.DisplayDialog("StockWars TownScene Setup", "마을 씬의 바닥(Ground) 및 배경 스크롤 시스템 세팅이 성공적으로 시작되었습니다!", "확인");
        }
    }
}
