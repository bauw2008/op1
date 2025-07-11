'use strict';
'require form';
'require poll';
'require rpc';
'require uci';
'require view';
'require fs';
'require ui';

const logPath = '/tmp/netspeedtest.log';

function controlService(action, port) {
    const chosenPort = port || '5201';
    const commands = {
        start: `/usr/bin/iperf3 -s -D -p ${chosenPort} --logfile ${logPath} >> ${logPath} 2>&1`,
        stop: '/usr/bin/killall -q iperf3'
    };

    return (action === 'start'
        ? fs.exec('/bin/sh', ['-c', `mkdir -p /tmp/netspeedtest && touch ${logPath} && chmod 644 ${logPath}`])
        : Promise.resolve()
    ).then(() => fs.exec('/bin/sh', ['-c', commands[action]]));
}

async function checkProcess() {
    try {
        const res = await fs.exec('/usr/bin/pgrep', ['iperf3']);
        return res.code === 0;
    } catch (err) {
        return false;
    }
}

function renderStatus(isRunning, port) {
    const color = isRunning ? 'green' : 'red';
    const statusText = isRunning ? _('RUNNING') : _('NOT RUNNING');
    return `<span style="color:${color}; font-weight:bold">${_('Iperf3 Server')} ${statusText}${isRunning ? ' (port: ' + port + ')' : ''}</span>`;
}

return view.extend({
    load: () => uci.load('netspeedtest'),

    render: function () {
	const m = new form.Map(
	    'netspeedtest',
	    _('Lan Speedtest Iperf3'),
	    '<a href="https://iperf.fr/iperf-download.php" target="_blank" rel="noreferrer">' +
		_('Official Website Download iperf3 client.') +
	    '</a> ' +
	    _('Speed Test command:') + ' iperf3 -c 🖥️ -p 5201' +
	    '<pre><code>' +
		_('TCP ⬇️ : iperf3 -c 🖥️ -P 10 -4 -R      TCP ⬆️ : iperf3 -c 🖥️ -P 10 -4 \n') +
		_('UDP ⬇️ : iperf3 -c 🖥️ -u -P 10 -4 -R      UDP ⬆️ : iperf3 -c 🖥️ -u -P 10 -4') +
	    '</code></pre>'
	);


        //
        // Section 1: 状态显示（独立在顶部）
        //
        const statusSection = m.section(form.TypedSection);
        statusSection.anonymous = true;
        statusSection.render = function () {
            const statusDiv = E('p', { id: 'iperf3_status' }, _('Collecting status...'));

            // Polling 状态
            poll.add(async () => {
                const running = await checkProcess();
                await uci.load('netspeedtest');
                const port = uci.get('netspeedtest', 'config', 'port') || '5201';
                const html = renderStatus(running, port);
                const view = document.getElementById('iperf3_status');
                if (view) view.innerHTML = html;
            }, 5);

            return E('div', { class: 'cbi-section' }, [statusDiv]);
        };

        //
        // Section 2: General Settings
        //
        const s = m.section(form.NamedSection, 'config', 'netspeedtest', _('General Settings'));

        // 添加“启动/停止按钮”作为一个字段项
        const btn = s.option(form.DummyValue, '_service_control', _('Iperf3 service control'));
        btn.rawhtml = true;
        btn.default = '';
		btn.render = function () {
			const button = E('button', {
				class: 'btn cbi-button',
			}, _('Start Server'));

			// 初始状态检测：渲染时立即更新按钮状态
			(async () => {
				const running = await checkProcess();
				await uci.load('netspeedtest');
				const port = uci.get('netspeedtest', 'config', 'port') || '5201';

				if (button) {
					button.disabled = false;
					button.textContent = running ? _('Stop Server') : _('Start Server');
					button.className = `btn cbi-button cbi-button-${running ? 'reset' : 'apply'}`;
				}

				const statusView = document.getElementById('iperf3_status');
				if (statusView)
					statusView.innerHTML = renderStatus(running, port);
			})();

			// 按钮点击行为
			button.addEventListener('click', async () => {
				button.disabled = true;

				await uci.load('netspeedtest');
				const port = uci.get('netspeedtest', 'config', 'port') || '5201';
				const running = await checkProcess();
				const action = running ? 'stop' : 'start';

				return controlService(action, port)
					.then(async () => {
						const running = await checkProcess();
						const statusView = document.getElementById('iperf3_status');
						if (statusView)
							statusView.innerHTML = renderStatus(running, port);

						button.textContent = running ? _('Stop Server') : _('Start Server');
						button.className = `btn cbi-button cbi-button-${running ? 'reset' : 'apply'}`;
					})
					.catch(err => {
						ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
					})
					.finally(() => {
						button.disabled = false;
					});
			});

			// Poll 自动刷新
			poll.add(async () => {
				const running = await checkProcess();
				await uci.load('netspeedtest');
				const port = uci.get('netspeedtest', 'config', 'port') || '5201';

				if (button) {
					button.textContent = running ? _('Stop Server') : _('Start Server');
					button.className = `btn cbi-button cbi-button-${running ? 'reset' : 'apply'}`;
				}

				const statusView = document.getElementById('iperf3_status');
				if (statusView)
					statusView.innerHTML = renderStatus(running, port);
			}, 5);

			return E('div', { class: 'cbi-value' }, [
				E('label', { class: 'cbi-value-title' }, _('Iperf3 service control')),
				E('div', { class: 'cbi-value-field' }, [ button ])
			]);
		};


        // 端口字段
        const o = s.option(form.Value, 'port', _('Port'));
        o.datatype = 'port';
        o.default = '5201';
        o.rmempty = false;
        o.description = _('Default port (5201).');

        return m.render();
    }
});

