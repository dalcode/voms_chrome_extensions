(async () => {
    const input = document.getElementById('wm_wed_place');
    if (!input) {
        return; // 대상 필드 없으면 즉시 종료 (스펙 7절)
    }

    const { hallCache } = await chrome.storage.local.get('hallCache');
    const halls = hallCache?.halls ?? [];
    if (halls.length === 0) {
        return; // 캐시 없으면 조용히 비활성 (스펙 7절)
    }

    const box = document.createElement('div');
    box.id = 'voms-hall-suggest';
    box.style.display = 'none';
    // 드롭다운 내부(스크롤바 포함) 클릭으로 input blur가 발생하지 않게 함
    box.addEventListener('mousedown', (e) => e.preventDefault());
    document.body.appendChild(box);

    let items = [];
    let activeIndex = -1;

    const close = () => {
        box.style.display = 'none';
        box.innerHTML = '';
        items = [];
        activeIndex = -1;
    };

    const position = () => {
        const rect = input.getBoundingClientRect();
        box.style.left = `${rect.left + window.scrollX}px`;
        box.style.top = `${rect.bottom + window.scrollY + 2}px`;
        box.style.minWidth = `${rect.width}px`;
    };

    const select = (index) => {
        const hall = items[index];
        if (!hall) {
            return;
        }
        input.value = hall.name; // 주소는 표시 전용, 입력값은 홀명만 (스펙 6절)
        close();
        input.focus();
    };

    const setActive = (index) => {
        const rows = box.querySelectorAll('.voms-hall-item');
        rows.forEach((row, i) => row.classList.toggle('active', i === index));
        activeIndex = index;
        rows[index]?.scrollIntoView({ block: 'nearest' });
    };

    const render = () => {
        items = HallMatcher.match(halls, input.value, 10);
        if (items.length === 0) {
            close();
            return;
        }
        box.innerHTML = '';
        items.forEach((hall, i) => {
            const row = document.createElement('div');
            row.className = 'voms-hall-item';

            const name = document.createElement('span');
            name.className = 'voms-hall-name';
            name.textContent = hall.name;

            const addr = document.createElement('span');
            addr.className = 'voms-hall-addr';
            addr.textContent = hall.addr ?? '';

            row.append(name, addr);
            row.addEventListener('mousedown', () => select(i));
            row.addEventListener('mouseenter', () => setActive(i));
            box.appendChild(row);
        });
        activeIndex = -1;
        position();
        box.style.display = 'block';
    };

    input.addEventListener('input', render);

    input.addEventListener('keydown', (e) => {
        // 한글 IME 조합 확정 Enter는 무시
        if (e.isComposing || box.style.display === 'none') {
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActive(Math.min(activeIndex + 1, items.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActive(Math.max(activeIndex - 1, 0));
                break;
            case 'Enter':
                if (activeIndex >= 0) {
                    e.preventDefault();
                    select(activeIndex);
                }
                break;
            case 'Escape':
                close();
                break;
            default:
                break;
        }
    });

    input.addEventListener('blur', () => close());
})();
