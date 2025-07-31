'use strict';
'require form';
'require poll';
'require rpc';
'require uci';
'require view';
'require fs';

var callServiceList = rpc.declare({
    object: 'service',
    method: 'list',
    params: ['name'],
    expect: { '': {} }
});

function getServiceStatus() {
    return L.resolveDefault(callServiceList('vusb'), {}).then(function(res) {
        var isRunning = false;
        try {
            isRunning = res['vusb']['instances']['vusb']['running'];
        } catch (e) {}
        return isRunning;
    });
}

function renderStatus(isRunning) {
    var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';
    return spanTemp.format(
        isRunning ? 'green' : 'red',
        _('Vusb Server'),
        isRunning ? _('RUNNING') : _('NOT RUNNING')
    );
}

return view.extend({
    load: function() {
        return uci.load('vusb');
    },

    render: function() {
        var m, s, o;

        m = new form.Map('vusb', _('Vusb USB Server'),
            '配置虚拟USB服务。将网络设备与本地主机上的USB设备进行映射。' +
            '<a href="https://github.com/bauw2008/op1/tree/main/luci-app-vusb" target="_blank">GitHub</a>，' +
            '<a id="client-software-link" href="http://www.virtualhere.com/usb_client_software" target="_blank">客户端下载</a>，并根据本地主机架构进行安装。<br>' +
            'vusbmipsel 注册码：xxxxxxxxxxxx，999，MCACDkn0jww6R5WOIjFqU/apAg4Um+mDkU2TBcC7fA1FrA==。<br>' +
            'vusbx86 注册码(自用): fcaa1433e422, 63, MCACDjNtTQQZkYAMIaTTIc4mAg4k70rRFO9CGvvYMxB8SA==。'
        );

        // 状态显示
        s = m.section(form.TypedSection);
        s.anonymous = true;
        s.render = function () {
            poll.add(function () {
                return getServiceStatus().then(function (res) {
                    var view = document.getElementById('vusb_status');
                    if (view) view.innerHTML = renderStatus(res);
                });
            });

            return E('div', { class: 'cbi-section', id: 'status_bar' }, [
                E('p', { id: 'vusb_status' }, _('Collecting data...'))
            ]);
        };

        // 主配置区
        s = m.section(form.NamedSection, 'config', 'vusb');

        o = s.option(form.Flag, 'enabled', _('启用'));
        o.default = o.disabled;
        o.rmempty = false;

        o = s.option(form.Value, 'port', _('端口'));
        o.default = '7575';
        o.datatype = 'port';

        o = s.option(form.Flag, 'ipv6', _('IPv6'));
        o.default = o.disabled;
        o.rmempty = false;

        o = s.option(form.Flag, 'ExtAccess', _('WEB'));
        o.default = o.disabled;
        o.rmempty = false;
		o.description = _('外网访问服务');

        o = s.option(form.Value, 'password', _('密码'));
        o.password = true;
        o.description = _('仅限激活客户端连接时需要输入正确的密码验证');
	
        return m.render();
    }
});
