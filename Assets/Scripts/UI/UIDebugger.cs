using UnityEngine;
using UnityEngine.EventSystems;
using System.Collections.Generic;

namespace StockWars.UI
{
    /// <summary>
    /// 마우스 클릭 시 어떤 UI 요소가 레이캐스트(Raycast)를 가로막고 있는지 콘솔에 출력하는 디버깅 툴입니다.
    /// </summary>
    public class UIDebugger : MonoBehaviour
    {
        void Update()
        {
            if (Input.GetMouseButtonDown(0))
            {
                if (EventSystem.current == null) return;

                PointerEventData pointerData = new PointerEventData(EventSystem.current)
                {
                    position = Input.mousePosition
                };

                List<RaycastResult> results = new List<RaycastResult>();
                EventSystem.current.RaycastAll(pointerData, results);

                if (results.Count > 0)
                {
                    GameObject clickedObj = results[0].gameObject;
                    Debug.Log($"<color=yellow>[UI Debugger]</color> Clicked UI: <b>{clickedObj.name}</b>\nFull Path: {GetGameObjectPath(clickedObj)}", clickedObj);
                }
                else
                {
                    Debug.Log("<color=cyan>[UI Debugger]</color> Clicked on empty space (No UI blocking)");
                }
            }
        }

        private string GetGameObjectPath(GameObject obj)
        {
            string path = obj.name;
            Transform current = obj.transform;
            while (current.parent != null)
            {
                current = current.parent;
                path = current.name + "/" + path;
            }
            return path;
        }
    }
}
