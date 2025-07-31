'use strict';
'require view';
'require fs';
'require ui';
'require uci';

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    saveConfig: function(textarea) {
        return uci.load('vusb').then(() => {
            const password = uci.get('vusb', 'config', 'password') || '';
            let content = textarea.value.trim().replace(/\r\n/g, '\n');

            content = content.replace(/^clientAuthorization=.*$/gm, '').trim();

            if (password !== '') {
                content += '\nclientAuthorization=/tmp/vusb_auth.sh "$VENDOR_ID$" "$PRODUCT_ID$" "$CLIENT_ID$" "$CLIENT_IP$" "$PRODUCT_SERIAL$" "$PASSWORD$" "$DEVPATH$" "$NICKNAME$" "$NUM_BINDINGS$"';
            }

            return fs.read('/etc/vusb/config.ini').then(oldContent => {
                const licenseMatch = oldContent.match(/^License=.*$/m);
                const hasLicenseInNew = /^License=.*$/m.test(content);

                if (licenseMatch && !hasLicenseInNew) {
                    content = licenseMatch[0] + '\n' + content;
                }

                if (oldContent !== content + '\n') {
                    return fs.write('/etc/vusb/config.ini', content + '\n');
                }
            });
        }).then(() => {

            ui.addNotification(null, E('p', _('配置已保存，正在重启服务...')));
            return fs.exec('/etc/init.d/vusb', ['restart']);
        }).then(() => {
            ui.addNotification(null, E('p', _('服务重启成功')));
            setTimeout(() => {
                location.reload();
            }, 1000);
        }).catch(err => {
            console.error('重启失败:', err);
            ui.addNotification(null, E('p', _('服务重启失败: ') + err.message));
        });
    },

    render: function() {
        const textarea = E('textarea', {
            class: 'cbi-input-textarea',
            style: 'width: 100%; height: 500px; marginTop: 10px;',
            wrap: 'off'
        }, _('加载中...'));

        fs.read('/etc/vusb/config.ini').then(content => {
            textarea.value = content || '';
        }).catch(err => {
            textarea.value = _('读取失败: ') + err.message;
        });

        const saveBtn = E('button', {
            class: 'cbi-button cbi-button-apply',
            style: 'margin-top: 10px;',
            click: () => this.saveConfig(textarea)
        }, _('保存并应用'));

        return E('div', { class: 'cbi-section' }, [
            E('h3', {}, _('编辑 config.ini')),
            textarea,
            saveBtn
        ]);
    }
});

