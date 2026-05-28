using UnityEngine;
using UnityEngine.UI;

namespace StockWars.UI
{
    /// <summary>
    /// UI 툴팁 프리팹의 최상단(Root) 오브젝트에 부착되어
    /// 텍스트 컴포넌트들을 직접 참조하고 레이아웃을 안전하게 리빌드하는 뷰 클래스.
    /// 하드코딩된 Find 연산을 제거하여 UI 계층구조 변경에 유연하게 대응합니다.
    /// </summary>
    public class UI_TooltipView : MonoBehaviour
    {
        [Header("UI Text References")]
        [Tooltip("툴팁 상단의 제목 텍스트")]
        [SerializeField] private Text titleText;

        [Tooltip("툴팁 중앙의 본문 텍스트")]
        [SerializeField] private Text contentText;

        /// <summary>
        /// 툴팁 UI 내부 데이터를 갱신합니다.
        /// </summary>
        public void SetData(string title, string content)
        {
            if (titleText != null)
            {
                titleText.gameObject.SetActive(!string.IsNullOrEmpty(title));
                titleText.text = title;
            }
            if (contentText != null)
            {
                contentText.text = content;
            }
        }

        /// <summary>
        /// 텍스트 데이터 갱신 즉시 레이아웃을 내부 자식 노드부터 안전하게 역순 리빌드하여
        /// 첫 프레임에 크기가 비정상적으로 연산되는 버그를 방어합니다.
        /// </summary>
        public void ForceRebuild()
        {
            if (titleText != null && titleText.gameObject.activeSelf)
            {
                LayoutRebuilder.ForceRebuildLayoutImmediate(titleText.rectTransform);
            }
            if (contentText != null && contentText.gameObject.activeSelf)
            {
                LayoutRebuilder.ForceRebuildLayoutImmediate(contentText.rectTransform);
            }
            
            // 최종적으로 본인(부모 RectTransform) 리빌드
            LayoutRebuilder.ForceRebuildLayoutImmediate(transform as RectTransform);
        }
    }
}
