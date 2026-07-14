using UnityEditor;
using UnityEngine;
using StockWars.UI;

namespace StockWars.Editor
{
    public class FindGhostCharts : EditorWindow
    {
        [MenuItem("StockWars/Find UIStockCharts in Scene")]
        public static void FindCharts()
        {
            UIStockChart[] charts = Resources.FindObjectsOfTypeAll<UIStockChart>();
            Debug.Log($"[FindGhostCharts] 총 {charts.Length}개의 UIStockChart 컴포넌트를 찾았습니다.");

            foreach (var chart in charts)
            {
                // 씬에 있는 오브젝트인지 확인 (에셋 프리팹 제외)
                if (chart.gameObject.scene.name != null)
                {
                    string path = GetGameObjectPath(chart.gameObject);
                    bool isActive = chart.gameObject.activeInHierarchy;
                    Debug.Log($"Found Chart: {path} | Active: {isActive}", chart.gameObject);
                }
            }
        }

        private static string GetGameObjectPath(GameObject obj)
        {
            string path = "/" + obj.name;
            while (obj.transform.parent != null)
            {
                obj = obj.transform.parent.gameObject;
                path = "/" + obj.name + path;
            }
            return path;
        }
    }
}
