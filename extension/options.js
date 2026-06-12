const statusEl = document.getElementById('status');
const apiUrlEl = document.getElementById('apiUrl');
const apiKeyEl = document.getElementById('apiKey');

const showStatus = (msg, isError = false) => {
    statusEl.textContent = msg;
    statusEl.classList.toggle('error', isError);
};

const showCacheInfo = async () => {
    const { hallCache } = await chrome.storage.local.get('hallCache');
    if (hallCache?.halls) {
        const at = new Date(hallCache.fetchedAt).toLocaleString('ko-KR');
        showStatus(`웨딩홀 ${hallCache.halls.length}개 (마지막 갱신: ${at})`);
    } else {
        showStatus('저장된 목록이 없습니다. API 정보를 저장한 뒤 목록을 갱신하세요.');
    }
};

const init = async () => {
    const { apiUrl = 'https://voms-test.dalcode.com', apiKey = '' } = await chrome.storage.sync.get(['apiUrl', 'apiKey']);
    apiUrlEl.value = apiUrl;
    apiKeyEl.value = apiKey;
    await showCacheInfo();
};

document.getElementById('save').addEventListener('click', async () => {
    await chrome.storage.sync.set({
        apiUrl: apiUrlEl.value.trim().replace(/\/+$/, ''),
        apiKey: apiKeyEl.value.trim(),
    });
    showStatus('저장되었습니다.');
});

document.getElementById('refresh').addEventListener('click', async () => {
    showStatus('갱신 중...');
    try {
        const result = await chrome.runtime.sendMessage({ type: 'refreshHalls' });
        if (result?.ok) {
            await showCacheInfo();
        } else {
            showStatus(`갱신 실패: ${result?.error ?? '알 수 없는 오류'}`, true);
        }
    } catch (err) {
        showStatus(`갱신 실패: ${err.message ?? err}`, true);
    }
});

init();
