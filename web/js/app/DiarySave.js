export function grantDiary(app) {
    if (!app.userProfile || app.userProfile.diaryReceived) return false;
    app.userProfile.diaryReceived = true;
    return true;
}

export async function saveDiary(app, quit = false) {
    if (app.demoEnded) return { error: '완료한 데모는 저장할 수 없어요.' };
    if (!app.userProfile?.diaryReceived) return { error: '모아에게 일기장을 받은 뒤 사용할 수 있어요.' };
    const previous = app.userProfile.diarySavedAt;
    app.userProfile.diarySavedAt = new Date().toISOString();
    if (!app.itemGameplay?.save()) {
        app.userProfile.diarySavedAt = previous;
        return { error: '저장하지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.' };
    }
    if (quit) {
        if (window.stockWarsDesktop?.quit) return await window.stockWarsDesktop.quit() || {};
        return { message: '저장했어요. 이제 브라우저 탭을 닫아도 괜찮아요.' };
    }
    return { message: '오늘의 발자취를 일기장에 저장했어요.' };
}
