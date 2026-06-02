using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TMPro;
using StockWars.Core;

namespace StockWars.UI
{
    /// <summary>
    /// CORE_GDD_05: 아늑한 2D 안나 스탠딩 일러스트를 오피스 캔버스 우측 하단에 배치하고
    /// 부드러운 호흡(Breathing) 및 바운싱 애니메이션과 대사 말풍선 인터페이스를 제공하는 UI 컴포넌트.
    /// </summary>
    public class AnnaStandingUI : Singleton<AnnaStandingUI>, IPointerClickHandler
    {
        [Header("Dialogue Box settings")]
        public float dialogueDuration = 4.0f;
        
        [Header("Animation Settings")]
        public float floatFrequency = 1.5f;     // 호흡 속도
        public float floatAmplitude = 8f;        // 상하 이동 크기 (픽셀)
        public float scaleAmplitude = 0.012f;    // 미세한 스케일 축소/확장 비율

        private Image _characterImage;
        private RectTransform _speechBalloon;
        private TextMeshProUGUI _speechText;
        private CanvasGroup _balloonCanvasGroup;

        private Vector3 _originalPosition;
        private Vector3 _originalScale;
        private float _animationTime = 0f;

        private Coroutine _hideBalloonCoroutine;
        private bool _isNightCostume = false;

        private readonly string[] _clickDialogues = {
            "시장은 언제나 변동하지만, 대표님의 날카로운 통찰은 흔들리지 않죠!",
            "투자는 무리하기보다 포트폴리오를 분산하여 리스크를 낮추는 것이 중요해요.",
            "자금이 급히 필요하시다면 금융 탭의 웰컴 무이자 론 상품을 살펴보시는 건 어떨까요?",
            "오늘도 오피스 차트들이 참 예쁜 빛을 내고 있네요. 화이팅입니다, 대표님!",
            "거래를 시작하기 전, 신문 뉴스의 헤드라인이나 증권가 찌라시를 꼼꼼히 확인해 보세요."
        };

        protected override void Awake()
        {
            base.Awake();
            if (Instance != this) return;

            BuildAnnaUI();
        }

        private void Start()
        {
            _originalScale = transform.localScale;
            var rt = GetComponent<RectTransform>();
            _originalPosition = rt.anchoredPosition;

            // 시작 환영 메시지 출력
            ShowDialogue("대표님, 어서오세요! 오늘 주식 시장의 흐름도 함께 지켜볼게요.");
        }

        private void OnEnable()
        {
            // 자산 변동 이벤트 구독
            EventBus.Subscribe<CashChangedEvent>(OnCashChanged);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<CashChangedEvent>(OnCashChanged);
        }

        private void Update()
        {
            ApplyBreathingAnimation();
        }

        /// <summary>
        /// 안나 UI 구성 요소를 동적으로 생성합니다. (에셋이 없을 시 고급스러운 플레이스홀더 출력)
        /// </summary>
        private void BuildAnnaUI()
        {
            RectTransform myRt = GetComponent<RectTransform>();
            if (myRt == null) myRt = gameObject.AddComponent<RectTransform>();

            // 우하단 고정 앵커링
            myRt.anchorMin = new Vector2(1f, 0f);
            myRt.anchorMax = new Vector2(1f, 0f);
            myRt.pivot = new Vector2(1f, 0f);
            myRt.anchoredPosition = new Vector2(-40f, 0f);
            myRt.sizeDelta = new Vector2(350f, 750f);

            // 레이캐스트 타겟 설정을 위한 보이지 않는 이미지 추가 (클릭 감지용)
            Image clickDetector = gameObject.AddComponent<Image>();
            clickDetector.color = new Color(0, 0, 0, 0.01f);

            // 1. 캐릭터 이미지 생성
            GameObject charGo = new GameObject("AnnaSprite", typeof(RectTransform), typeof(Image));
            charGo.transform.SetParent(transform, false);
            RectTransform charRt = charGo.GetComponent<RectTransform>();
            charRt.anchorMin = Vector2.zero;
            charRt.anchorMax = Vector2.one;
            charRt.offsetMin = Vector2.zero;
            charRt.offsetMax = Vector2.zero;

            _characterImage = charGo.GetComponent<Image>();
            _characterImage.raycastTarget = false;
            
            LoadCharacterSprite();

            // 2. 말풍선(Speech Balloon) 생성
            GameObject balloonGo = new GameObject("SpeechBalloon", typeof(RectTransform), typeof(Image), typeof(CanvasGroup));
            balloonGo.transform.SetParent(transform, false);
            _speechBalloon = balloonGo.GetComponent<RectTransform>();
            
            // 안나 머리 왼편에 오도록 세팅
            _speechBalloon.anchorMin = new Vector2(0f, 1f);
            _speechBalloon.anchorMax = new Vector2(0f, 1f);
            _speechBalloon.pivot = new Vector2(1f, 0.5f);
            _speechBalloon.anchoredPosition = new Vector2(-10f, -220f);
            _speechBalloon.sizeDelta = new Vector2(320f, 130f);

            Image balloonImg = balloonGo.GetComponent<Image>();
            balloonImg.color = new Color(0.08f, 0.08f, 0.12f, 0.95f); // 어두운 말풍선 반투명 배경
            balloonImg.raycastTarget = false;

            // 말풍선 테두리 Neon Cyan
            GameObject borderGo = new GameObject("Border", typeof(RectTransform), typeof(Image));
            borderGo.transform.SetParent(balloonGo.transform, false);
            RectTransform borderRt = borderGo.GetComponent<RectTransform>();
            borderRt.anchorMin = Vector2.zero;
            borderRt.anchorMax = Vector2.one;
            borderRt.offsetMin = Vector2.zero;
            borderRt.offsetMax = Vector2.zero;
            borderGo.GetComponent<Image>().color = new Color(0f, 0.92f, 1f, 0.6f);
            // 픽셀 외곽선 느낌을 위해 간격 2px 패딩 설정
            borderRt.offsetMin = new Vector2(-2f, -2f); // 간접 패딩으로 테두리 효과
            borderRt.offsetMax = new Vector2(2f, 2f);
            borderGo.transform.SetAsFirstSibling();

            _balloonCanvasGroup = balloonGo.GetComponent<CanvasGroup>();
            _balloonCanvasGroup.alpha = 0f; // 기본 불투명도 0 (숨김)

            // 2.1 말풍선 내부 텍스트 생성
            GameObject textGo = new GameObject("Text", typeof(RectTransform), typeof(TextMeshProUGUI));
            textGo.transform.SetParent(_speechBalloon, false);
            RectTransform textRt = textGo.GetComponent<RectTransform>();
            textRt.anchorMin = Vector2.zero;
            textRt.anchorMax = Vector2.one;
            textRt.offsetMin = new Vector2(15f, 15f);
            textRt.offsetMax = new Vector2(-15f, -15f);

            _speechText = textGo.GetComponent<TextMeshProUGUI>();
            _speechText.fontSize = 15;
            _speechText.color = Color.white;
            _speechText.alignment = TextAlignmentOptions.MidlineLeft;
            _speechText.overflowMode = TextOverflowModes.Ellipsis;
            _speechText.raycastTarget = false;
        }

        /// <summary>
        /// 의상에 맞는 안나 일러스트 스프라이트를 로드합니다. 에셋이 없는 경우 고급 스타일의 플레이스홀더를 생성합니다.
        /// </summary>
        private void LoadCharacterSprite()
        {
            string spritePath = _isNightCostume ? "Sprites/Characters/anna_night" : "Sprites/Characters/anna_standing";
            Sprite characterSprite = Resources.Load<Sprite>(spritePath);

            if (characterSprite != null)
            {
                _characterImage.sprite = characterSprite;
                _characterImage.color = Color.white;
                // 기존 임시 텍스트 자식이 있다면 소거
                var tempText = _characterImage.transform.Find("PlaceholderText");
                if (tempText != null) Destroy(tempText.gameObject);
            }
            else
            {
                // 플레이스홀더 장식 (에셋 부재 시의 안전장치)
                _characterImage.sprite = null;
                _characterImage.color = new Color(0.1f, 0.1f, 0.15f, 0.85f); // 고급 아르곤 색상
                
                // 테두리 추가
                var outline = _characterImage.gameObject.GetComponent<Outline>();
                if (outline == null) outline = _characterImage.gameObject.AddComponent<Outline>();
                outline.effectColor = new Color(0f, 0.92f, 1f, 0.8f);
                outline.effectDistance = new Vector2(3f, 3f);

                Transform existingText = _characterImage.transform.Find("PlaceholderText");
                if (existingText == null)
                {
                    GameObject txtGo = new GameObject("PlaceholderText", typeof(RectTransform), typeof(TextMeshProUGUI));
                    txtGo.transform.SetParent(_characterImage.transform, false);
                    RectTransform txtRt = txtGo.GetComponent<RectTransform>();
                    txtRt.anchorMin = Vector2.zero;
                    txtRt.anchorMax = Vector2.one;
                    txtRt.offsetMin = Vector2.zero;
                    txtRt.offsetMax = Vector2.zero;

                    TextMeshProUGUI tmp = txtGo.GetComponent<TextMeshProUGUI>();
                    tmp.text = $"<b>ANNA</b>\n<size=12><color=#666688>[Standing Art Placeholder]</color></size>\n\n<size=11><color=#00EAFF>{(_isNightCostume ? "Night Costume" : "Office Uniform")}</color></size>";
                    tmp.fontSize = 20;
                    tmp.color = Color.white;
                    tmp.alignment = TextAlignmentOptions.Center;
                }
            }
        }

        /// <summary>
        /// 의상을 사무직 유니폼 또는 나이트 가운(실크 파자마)으로 토글 전환합니다.
        /// </summary>
        public void ToggleCostume(bool isNight)
        {
            _isNightCostume = isNight;
            LoadCharacterSprite();
            ShowDialogue(_isNightCostume ? "오늘 업무도 모두 마무리되었네요. 편안한 밤 보내세요, 대표님!" : "새로운 아침 업무를 시작할 준비가 되었습니다!");
        }

        /// <summary>
        /// 삼각함수 파형을 기반으로 미세하게 떠오르고 호흡하는 바운싱 효과를 구현합니다.
        /// </summary>
        private void ApplyBreathingAnimation()
        {
            _animationTime += Time.deltaTime;
            
            // 1. 미세한 상하 플로팅 (Translation Y)
            float yOffset = Mathf.Sin(_animationTime * floatFrequency) * floatAmplitude;
            RectTransform rt = GetComponent<RectTransform>();
            rt.anchoredPosition = _originalPosition + new Vector3(0f, yOffset, 0f);

            // 2. 미세한 크기 변동 (호흡 느낌 스케일링)
            float scaleOffset = Mathf.Sin(_animationTime * floatFrequency) * scaleAmplitude;
            transform.localScale = _originalScale + new Vector3(scaleOffset, -scaleOffset * 0.5f, 0f);
        }

        /// <summary>
        /// 지정한 메세지를 말풍선에 띄우고 서서히 숨기는 애니메이션 코루틴을 작동시킵니다.
        /// </summary>
        public void ShowDialogue(string text)
        {
            if (_speechText == null || _balloonCanvasGroup == null) return;

            _speechText.text = text;

            if (_hideBalloonCoroutine != null)
            {
                StopCoroutine(_hideBalloonCoroutine);
            }
            _hideBalloonCoroutine = StartCoroutine(DialogueFlowCoroutine());
        }

        private IEnumerator DialogueFlowCoroutine()
        {
            // 말풍선 서서히 나타남 (Fade In)
            float elapsed = 0f;
            float fadeDuration = 0.3f;
            while (elapsed < fadeDuration)
            {
                elapsed += Time.deltaTime;
                _balloonCanvasGroup.alpha = Mathf.Lerp(0f, 1f, elapsed / fadeDuration);
                yield return null;
            }
            _balloonCanvasGroup.alpha = 1f;

            // 유지
            yield return new WaitForSeconds(dialogueDuration);

            // 말풍선 서서히 사라짐 (Fade Out)
            elapsed = 0f;
            while (elapsed < fadeDuration)
            {
                elapsed += Time.deltaTime;
                _balloonCanvasGroup.alpha = Mathf.Lerp(1f, 0f, elapsed / fadeDuration);
                yield return null;
            }
            _balloonCanvasGroup.alpha = 0f;
            _hideBalloonCoroutine = null;
        }

        /// <summary>
        /// 안나 캐릭터를 클릭했을 때 상호작용 피드백 (대사 순환 연출)
        /// </summary>
        public void OnPointerClick(PointerEventData eventData)
        {
            // 랜덤 대사 선택 후 출력
            int randIndex = UnityEngine.Random.Range(0, _clickDialogues.Length);
            ShowDialogue(_clickDialogues[randIndex]);

            // 미세한 깜짝 스케일 리액션 효과 적용
            transform.localScale = _originalScale * 1.08f;
        }

        /// <summary>
        /// 플레이어 골드가 입출금될 때의 상황별 코멘트 리액션
        /// </summary>
        private void OnCashChanged(CashChangedEvent e)
        {
            if (e.Delta > 0)
            {
                // 입금 리액션
                if (e.Delta >= 100000)
                {
                    ShowDialogue("엄청난 수익이네요! 대표님, 정말 훌륭한 안목이십니다!");
                }
                else
                {
                    ShowDialogue("자산이 증가했습니다. 좋은 거래였어요!");
                }
            }
            else if (e.Delta < 0)
            {
                // 출금/투자 리액션
                ShowDialogue("투자금이 성공적으로 집행되었습니다. 자산 포트폴리오를 주시해주세요.");
            }
        }
    }
}
