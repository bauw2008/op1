'use strict';
'require dom';
'require fs';
'require poll';
'require ui';
'require view';

const logPath = '/var/log/vusb.log';

let userScrolled = false;
let scrollPosition = 0;
let logTextarea;

function pollLog() {
    return fs.stat(logPath).then(stat => {
        if (!stat || stat.size === 0) {
            logTextarea.value = _('日志为空');
            return;
        }

        return fs.read(logPath).then(content => {
            logTextarea.value = content || _('日志为空');

            if (!userScrolled) {
                logTextarea.scrollTop = logTextarea.scrollHeight;
            } else {
                logTextarea.scrollTop = scrollPosition;
            }
        });
    }).catch(err => {
        logTextarea.value = _('日志读取失败: ') + err.message;
    });
}

return view.extend({
    handleClearLog: function () {
        return fs.write(logPath, '').then(() => {
            if (logTextarea) {
                logTextarea.value = _('日志为空');
                logTextarea.scrollTop = 0;
                userScrolled = false;
            }
            ui.addNotification(null, E('p', _('日志已清空')));
        }).catch(err => {
            ui.addNotification(null, E('p', _('清空日志失败: ') + err.message));
        });
    },

    render: function () {
        logTextarea = E('textarea', {
            class: 'cbi-input-textarea',
            wrap: 'off',
            readonly: true,
            style: 'width: 100%; height: 500px; margin-top: 10px; overflowY: ' + 'scroll'
        });

        logTextarea.addEventListener('scroll', function () {
            userScrolled = true;
            scrollPosition = logTextarea.scrollTop;
        });

        const clearButton = E('button', {
            class: 'cbi-button cbi-button-primary',
            style: 'margin-top: 10px;',
            click: this.handleClearLog.bind(this)
        }, _('清空日志'));

        poll.add(pollLog);

        return E('div', { class: 'cbi-section' }, [
            clearButton,
            logTextarea,
            E('div', { style: 'margin-top:5px; font-size: 0.9em; color: #666;' },
                _('日志每 %s 秒自动刷新').format(L.env.pollinterval || 10))
        ]);
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});

