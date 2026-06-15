using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace StockWars.UI
{
    /// <summary>
    /// 기존 UI 구조와 레이아웃 그룹을 깨트리지 않고, 텍스트만 안전하게 좌우로 흐르게(Marquee) 구현하는 컴포넌트입니다.
    /// 오리지널 오브젝트에 RectMask2D를 장착하고 자식 스크롤 텍스트를 생성하여 틀(Bound) 바깥으로 나가는 것을 철저하게 차단합니다.
    /// </summary>
    [RequireComponent(typeof(RectTransform), typeof(TMP_Text))]
    public class UITickerMarquee : MonoBehaviour
    {
        [Tooltip("이동 속도 (픽셀/초). 왼쪽에서 오른쪽으로 흘러가므로 양수를 입력합니다.")]
        [SerializeField] private float _speed = 50f;

        private RectTransform _parentRectTransform;
        private TMP_Text _parentTmpText;
        
        private GameObject _childTextGo;
        private RectTransform _childRectTransform;
        private TMP_Text _childTmpText;
        
        private string _lastText = "";

        void Start()
        {
            _parentRectTransform = GetComponent<RectTransform>();
            _parentTmpText = GetComponent<TMP_Text>();

            // 1. 부모 오브젝트 자체에 RectMask2D를 추가하여 자식 텍스트가 경계 밖으로 나가지 않게 차단
            if (GetComponent<RectMask2D>() == null)
            {
                gameObject.AddComponent<RectMask2D>();
            }

            // 2. 실제 스크롤을 담당할 자식 텍스트 오브젝트 생성
            _childTextGo = new GameObject("ScrollingText_Child", typeof(RectTransform), typeof(TextMeshProUGUI));
            _childTextGo.transform.SetParent(transform, false);

            _childRectTransform = _childTextGo.GetComponent<RectTransform>();
            
            // 앵커 및 피벗을 중앙 정렬하여 안정적인 스크롤 연산 보장
            _childRectTransform.anchorMin = new Vector2(0.5f, 0.5f);
            _childRectTransform.anchorMax = new Vector2(0.5f, 0.5f);
            _childRectTransform.pivot = new Vector2(0.5f, 0.5f);
            _childRectTransform.anchoredPosition = Vector2.zero;

            // 3. 자식 TextMeshPro 설정 및 복제
            _childTmpText = _childTextGo.GetComponent<TMP_Text>();
            if (_parentTmpText != null && _childTmpText != null)
            {
                CopyTextSettings(_parentTmpText, _childTmpText);
                _childTmpText.enableWordWrapping = false; // 줄바꿈 차단
            }
        }

        void Update()
        {
            if (_parentTmpText == null || _childTmpText == null || _childRectTransform == null) return;

            // 4. 부모 텍스트가 외부(컨트롤러 등)에서 변경되었는지 감지하여 동기화
            if (_parentTmpText.text != _lastText)
            {
                _lastText = _parentTmpText.text;
                _childTmpText.text = _lastText;
            }

            // 5. 부모 텍스트 컴포넌트 자체는 화면에 노출되지 않도록 처리 (레이아웃 크기는 유지됨)
            _parentTmpText.maxVisibleCharacters = 0;

            // 6. 스크롤 위치 이동 연산
            float parentWidth = _parentRectTransform.rect.width;
            float textWidth = _childTmpText.preferredWidth;

            // 왼쪽 화면 밖 시작점과 오른쪽 화면 밖 소멸점
            float startX = -parentWidth / 2f - textWidth / 2f;
            float endX = parentWidth / 2f + textWidth / 2f;

            Vector3 localPos = _childRectTransform.localPosition;
            localPos.x += _speed * Time.deltaTime;
            localPos.y = 0f; // 부모 틀 기준 세로 정중앙 고정

            // 범위를 초과하면 다시 왼쪽 시작점으로 롤백
            if (localPos.x > endX)
            {
                localPos.x = startX;
            }

            _childRectTransform.localPosition = localPos;
        }

        /// <summary>
        /// 부모 TextMeshPro의 서식 설정을 자식 스크롤 텍스트에 복사합니다.
        /// </summary>
        private void CopyTextSettings(TMP_Text source, TMP_Text target)
        {
            target.font = source.font;
            target.fontSize = source.fontSize;
            target.fontStyle = source.fontStyle;
            target.color = source.color;
            target.alignment = source.alignment;
            target.fontSharedMaterial = source.fontSharedMaterial;
            target.spriteAsset = source.spriteAsset;
        }
    }
}
