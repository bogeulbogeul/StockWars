using UnityEditor;
using UnityEngine;
using StockWars.Core;

namespace StockWars.Editor
{
    /// <summary>
    /// ReadOnlyDisplayAttribute가 선언된 변수를 인스펙터 창에서 읽기 전용으로 시각화해주는 에디터 드로어
    /// </summary>
    [CustomPropertyDrawer(typeof(ReadOnlyDisplayAttribute))]
    public class ReadOnlyDisplayDrawer : PropertyDrawer
    {
        public override float GetPropertyHeight(SerializedProperty property, GUIContent label)
        {
            return EditorGUI.GetPropertyHeight(property, label, true);
        }

        public override void OnGUI(Rect position, SerializedProperty property, GUIContent label)
        {
            // GUI 비활성화를 통한 인스펙터 편집 차단
            GUI.enabled = false;
            EditorGUI.PropertyField(position, property, label, true);
            GUI.enabled = true;
        }
    }
}
