using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;
using UnityEngine;

namespace StockWars.Core
{
    /// <summary>
    /// 게임 내 모든 세이브 데이터의 안전한 암복호화 및 무결성 검증을 책임지는 고성능 직렬화 유틸리티.
    /// Newtonsoft.Json을 기반으로 작동하며, 전체 파일 암호화(AES-256 CBC) 및 변조 방지용 해시(SHA-256 Checksum) 포맷을 지원합니다.
    /// 보안성 극대화를 위해 매 저장 시마다 임의의 초기화 벡터(Dynamic IV)를 동적 생성하여 대칭키 디프 차트 분석을 완전히 무력화합니다.
    /// </summary>
    public static class DataSerializer
    {
        // 보안 시드 설정 (키 디컴파일 방지용 해싱 유도)
        private const string KEY_SEED = "StockWars_UltimateGIGDC_SecretSaveKeySeed_2026!!";
        private const string CHECKSUM_DELIMITER = "\n--CHECKSUM--:";

        // JSON 직렬화 옵션 통합 관리 (UTC 강제 설정)
        private static readonly JsonSerializerSettings JsonSettings = new JsonSerializerSettings
        {
            DateTimeZoneHandling = DateTimeZoneHandling.Utc,
            Formatting = Formatting.Indented, // 가독성 및 정합성 보장
            NullValueHandling = NullValueHandling.Ignore
        };

        #region Public Interface (세이브 데이터 입출력)

        /// <summary>
        /// 객체를 직렬화한 후 AES-256으로 암호화하고 마지막 줄에 무결성 검증용 SHA-256 해시를 덧붙여 반환합니다.
        /// </summary>
        /// <typeparam name="T">직렬화할 객체 타입</typeparam>
        /// <param name="data">직렬화 대상 객체</param>
        /// <returns>체크섬이 포함된 최종 저장용 암호문 문자열</returns>
        public static string SerializeAndEncrypt<T>(T data)
        {
            if (data == null) throw new ArgumentNullException(nameof(data));

            try
            {
                // 1. 객체를 JSON 평문 문자열로 직렬화
                string plainJson = JsonConvert.SerializeObject(data, JsonSettings);

                // 2. 평문 JSON을 AES-256으로 완전히 암호화 (Base64 형식, IV 자동 결합)
                string encryptedBody = EncryptAES256(plainJson);

                // 3. 암호문 본문의 SHA-256 해시값 연산
                string checksum = ComputeSHA256(encryptedBody);

                // 4. 본문 맨 아랫줄에 체크섬 규격을 결합하여 패키징
                StringBuilder sb = new StringBuilder();
                sb.Append(encryptedBody);
                sb.Append(CHECKSUM_DELIMITER);
                sb.Append(checksum);

                return sb.ToString();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[DataSerializer] Serialization and Encryption failed: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// 체크섬 규격이 포함된 암호문 파일을 읽어, 위변조 여부를 1차 검증하고 복호화 및 역직렬화를 완료하여 반환합니다.
        /// </summary>
        /// <typeparam name="T">역직렬화할 객체 타입</typeparam>
        /// <param name="rawContent">세이브 파일 원본 텍스트 내용</param>
        /// <returns>역직렬화 복구된 객체</returns>
        /// <exception cref="InvalidDataException">체크섬이 다르거나 파일이 훼손되었을 때 발생</exception>
        public static T DecryptAndDeserialize<T>(string rawContent)
        {
            if (string.IsNullOrWhiteSpace(rawContent))
            {
                throw new ArgumentException("Save raw data is empty.", nameof(rawContent));
            }

            try
            {
                // 1. 체크섬 구분자 유무 및 포맷 분할
                int delimiterIndex = rawContent.LastIndexOf(CHECKSUM_DELIMITER, StringComparison.Ordinal);
                if (delimiterIndex == -1)
                {
                    throw new InvalidDataException("[DataSerializer] Invalid file structure: Checksum token is missing.");
                }

                // 암호문 본문과 포함된 체크섬 해시 분리
                string encryptedBody = rawContent.Substring(0, delimiterIndex).Trim();
                string savedChecksum = rawContent.Substring(delimiterIndex + CHECKSUM_DELIMITER.Length).Trim();

                // 2. 무결성 검증 (Integrity Check)
                string calculatedChecksum = ComputeSHA256(encryptedBody);
                if (!string.Equals(savedChecksum, calculatedChecksum, StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidDataException("[DataSerializer] Security Alert: Save file corruption or tampering detected! Checksum mismatch.");
                }

                // 3. 암호문 복호화하여 평문 JSON 획득
                string plainJson = DecryptAES256(encryptedBody);

                // 4. JSON 문자열 역직렬화하여 객체 최종 복구
                return JsonConvert.DeserializeObject<T>(plainJson, JsonSettings);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[DataSerializer] Decryption and Deserialization failed: {ex.Message}");
                throw;
            }
        }

        #endregion

        #region Core Cryptography (대칭 암호 및 해시 연산)

        /// <summary>
        /// 평문을 AES-256 CBC 모드로 매번 동적 생성된 임의의 IV를 적용하여 암호화한 뒤, IV 16바이트를 암호문 바이트 헤더로 결합하여 Base64로 반환합니다.
        /// </summary>
        private static string EncryptAES256(string plainText)
        {
            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
            byte[] key = GetKey256();

            using (Aes aes = Aes.Create())
            {
                aes.Key = key;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;
                
                // 암호화 주기에 따라 안전한 난수 기반 IV 생성
                aes.GenerateIV();
                byte[] iv = aes.IV; // 16 bytes

                using (ICryptoTransform encryptor = aes.CreateEncryptor())
                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                    {
                        cs.Write(plainBytes, 0, plainBytes.Length);
                        cs.FlushFinalBlock();
                    }

                    byte[] encryptedBytes = ms.ToArray();
                    
                    // IV(16바이트) + 암호문(가변바이트) 결합하여 하나의 바이트 배열로 생성
                    byte[] combinedBytes = new byte[iv.Length + encryptedBytes.Length];
                    Buffer.BlockCopy(iv, 0, combinedBytes, 0, iv.Length);
                    Buffer.BlockCopy(encryptedBytes, 0, combinedBytes, iv.Length, encryptedBytes.Length);

                    return Convert.ToBase64String(combinedBytes);
                }
            }
        }

        /// <summary>
        /// Base64 암호문 바이트 헤더로부터 IV(16바이트)를 추출해 복호화를 복구합니다.
        /// </summary>
        private static string DecryptAES256(string cipherText)
        {
            byte[] combinedBytes = Convert.FromBase64String(cipherText);

            // AES 블록 크기 기준(IV 16바이트) 이하인 경우 해독 무력화 예외 처리
            if (combinedBytes.Length < 16)
            {
                throw new CryptographicException("[DataSerializer] Cipher text is too short to contain IV header.");
            }

            byte[] key = GetKey256();
            
            // 1. 첫 16바이트에서 동적 IV 복구
            byte[] iv = new byte[16];
            Buffer.BlockCopy(combinedBytes, 0, iv, 0, 16);

            // 2. 나머지 바이트에서 실제 암호문 추출
            byte[] cipherBytes = new byte[combinedBytes.Length - 16];
            Buffer.BlockCopy(combinedBytes, 16, cipherBytes, 0, cipherBytes.Length);

            using (Aes aes = Aes.Create())
            {
                aes.Key = key;
                aes.IV = iv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;

                using (ICryptoTransform decryptor = aes.CreateDecryptor())
                using (MemoryStream ms = new MemoryStream())
                {
                    using (CryptoStream cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Write))
                    {
                        cs.Write(cipherBytes, 0, cipherBytes.Length);
                        cs.FlushFinalBlock();
                    }
                    return Encoding.UTF8.GetString(ms.ToArray());
                }
            }
        }

        /// <summary>
        /// 입력 문자열에 대한 SHA-256 16진수 체크섬 해시값을 생성합니다.
        /// </summary>
        public static string ComputeSHA256(string input)
        {
            byte[] inputBytes = Encoding.UTF8.GetBytes(input);
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(inputBytes);
                StringBuilder sb = new StringBuilder();
                foreach (byte b in hashBytes)
                {
                    sb.Append(b.ToString("x2"));
                }
                return sb.ToString();
            }
        }

        #endregion

        #region Helper Functions (키 유도 방식)

        /// <summary>
        /// KEY_SEED 문자열을 해싱하여 256비트(32바이트) 암호화 키를 유도합니다.
        /// </summary>
        private static byte[] GetKey256()
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                return sha256.ComputeHash(Encoding.UTF8.GetBytes(KEY_SEED));
            }
        }

        #endregion
    }
}
