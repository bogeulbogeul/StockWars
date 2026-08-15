using UnityEngine;

namespace StockWars.Town
{
    /// <summary>
    /// 마을 씬의 바닥(Ground) 시각적 세팅 및 2D 콜라이더(BoxCollider2D) 자동 관리를 담당하는 스크립트.
    /// 프로젝트의 따뜻한 베이지/크림 톤(#FBF0D9 / #E8D3B0)과 다크 브라운 아웃라인(#54311A) 스타일을 지원합니다.
    /// </summary>
    public class TownGroundController : MonoBehaviour
    {
        [Header("마을 맵 물리 경계 범위")]
        [SerializeField] private float _townWidth = 40f;
        [SerializeField] private float _groundHeight = 2.5f;
        [SerializeField] private float _groundYOffset = -4f;

        [Header("실제 바닥 스프라이트 에셋 설정")]
        [SerializeField] private Sprite _leftGroundSprite;
        [SerializeField] private Sprite _midGroundSprite;
        [SerializeField] private Sprite _rightGroundSprite;

        [Header("자동 콜라이더 생성 여부")]
        [SerializeField] private bool _autoCreateColliders = true;

        private BoxCollider2D _groundCollider;
        private GameObject _leftWall;
        private GameObject _rightWall;

        public float TownWidth => _townWidth;
        public float GroundYOffset => _groundYOffset;

        private void Awake()
        {
            SetupGroundVisualsAndPhysics();
        }

        /// <summary>
        /// 바닥 비주얼과 콜라이더를 런타임/에디터 상에서 설정
        /// </summary>
        public void SetupGroundVisualsAndPhysics()
        {
            transform.position = new Vector3(0f, _groundYOffset, 0f);

            // 유저가 직접 수동으로 깔아둔 바닥(TownBlock)과 중복 생성되지 않도록 
            // 자동 비주얼 메시 생성을 비활성화하고 콜라이더만 관리합니다.
            if (_autoCreateColliders)
            {
                EnsurePhysicsColliders();
            }
        }

        private void LoadDefaultSpritesIfNull()
        {
#if UNITY_EDITOR
            if (_leftGroundSprite == null || _midGroundSprite == null || _rightGroundSprite == null)
            {
                var sprites = UnityEditor.AssetDatabase.LoadAllAssetsAtPath("Assets/Sprites/Environment/ground_9slice_atlas.png");
                foreach (var s in sprites)
                {
                    if (s is Sprite sprite)
                    {
                        if (sprite.name == "ground_left") _leftGroundSprite = sprite;
                        else if (sprite.name == "ground_mid") _midGroundSprite = sprite;
                        else if (sprite.name == "ground_right") _rightGroundSprite = sprite;
                    }
                }
            }
#endif
        }

        private void EnsureSpriteGroundRenderers()
        {
            float pieceWidth = 8f; // 스프라이트 조각 기본 폭
            if (_midGroundSprite != null)
            {
                pieceWidth = _midGroundSprite.bounds.size.x;
            }

            // 1. Left Piece
            Transform leftPieceTr = transform.Find("Piece_Left");
            GameObject leftPieceObj = leftPieceTr != null ? leftPieceTr.gameObject : new GameObject("Piece_Left");
            leftPieceObj.transform.SetParent(transform, false);
            var leftRenderer = leftPieceObj.GetComponent<SpriteRenderer>();
            if (leftRenderer == null) leftRenderer = leftPieceObj.AddComponent<SpriteRenderer>();
            leftRenderer.sprite = _leftGroundSprite;
            leftRenderer.color = Color.white;
            leftRenderer.sortingOrder = 0;
            leftPieceObj.transform.localPosition = new Vector3(-_townWidth * 0.5f + pieceWidth * 0.5f, 0f, 0f);

            // 2. Right Piece
            Transform rightPieceTr = transform.Find("Piece_Right");
            GameObject rightPieceObj = rightPieceTr != null ? rightPieceTr.gameObject : new GameObject("Piece_Right");
            rightPieceObj.transform.SetParent(transform, false);
            var rightRenderer = rightPieceObj.GetComponent<SpriteRenderer>();
            if (rightRenderer == null) rightRenderer = rightPieceObj.AddComponent<SpriteRenderer>();
            rightRenderer.sprite = _rightGroundSprite;
            rightRenderer.color = Color.white;
            rightRenderer.sortingOrder = 0;
            rightPieceObj.transform.localPosition = new Vector3(_townWidth * 0.5f - pieceWidth * 0.5f, 0f, 0f);

            // 3. Middle Piece (가로 반복 Tiled 또는 Scaled)
            Transform midPieceTr = transform.Find("Piece_Mid");
            GameObject midPieceObj = midPieceTr != null ? midPieceTr.gameObject : new GameObject("Piece_Mid");
            midPieceObj.transform.SetParent(transform, false);
            var midRenderer = midPieceObj.GetComponent<SpriteRenderer>();
            if (midRenderer == null) midRenderer = midPieceObj.AddComponent<SpriteRenderer>();
            midRenderer.sprite = _midGroundSprite;
            midRenderer.color = Color.white;
            midRenderer.sortingOrder = 0;

            float midSpanWidth = Mathf.Max(1f, _townWidth - (pieceWidth * 2f));
            if (_midGroundSprite != null)
            {
                midRenderer.drawMode = SpriteDrawMode.Tiled;
                midRenderer.size = new Vector2(midSpanWidth, _midGroundSprite.bounds.size.y);
            }
            midPieceObj.transform.localPosition = Vector3.zero;
        }

        private void EnsurePhysicsColliders()
        {
            // 지면 바닥 물리 콜라이더
            _groundCollider = GetComponent<BoxCollider2D>();
            if (_groundCollider == null)
            {
                _groundCollider = gameObject.AddComponent<BoxCollider2D>();
            }

            _groundCollider.size = new Vector2(_townWidth, _groundHeight);
            _groundCollider.offset = new Vector2(0f, -_groundHeight * 0.5f);

            // 좌측 경계 벽 (Left Wall)
            Transform leftTr = transform.Find("LeftWallBoundary");
            if (leftTr == null)
            {
                _leftWall = new GameObject("LeftWallBoundary");
                _leftWall.transform.SetParent(transform, false);
                var col = _leftWall.AddComponent<BoxCollider2D>();
                col.size = new Vector2(2f, 20f);
                col.offset = Vector2.zero;
            }
            else
            {
                _leftWall = leftTr.gameObject;
            }
            _leftWall.transform.localPosition = new Vector3(-_townWidth * 0.5f - 1f, 10f, 0f);

            // 우측 경계 벽 (Right Wall)
            Transform rightTr = transform.Find("RightWallBoundary");
            if (rightTr == null)
            {
                _rightWall = new GameObject("RightWallBoundary");
                _rightWall.transform.SetParent(transform, false);
                var col = _rightWall.AddComponent<BoxCollider2D>();
                col.size = new Vector2(2f, 20f);
                col.offset = Vector2.zero;
            }
            else
            {
                _rightWall = rightTr.gameObject;
            }
            _rightWall.transform.localPosition = new Vector3(_townWidth * 0.5f + 1f, 10f, 0f);
        }

        private static Sprite _squareSprite;
        private static Sprite GetOrCreateSquareSprite()
        {
            if (_squareSprite == null)
            {
                Texture2D tex = new Texture2D(1, 1);
                tex.SetPixel(0, 0, Color.white);
                tex.Apply();
                _squareSprite = Sprite.Create(tex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
            }
            return _squareSprite;
        }

#if UNITY_EDITOR
        private void OnValidate()
        {
            if (!Application.isPlaying)
            {
                SetupGroundVisualsAndPhysics();
            }
        }
#endif
    }
}
