'use strict';
'require form';
'require fs';
'require view';

return view.extend({
    load: function() {
        const commands = [
            fs.exec('/usr/bin/turboacc_check_status', ['fastpath']),
            fs.exec('/usr/bin/turboacc_check_status', ['fullconenat']),
            fs.exec('/usr/bin/turboacc_check_status', ['bbr'])
        ];

        return Promise.all(commands).then(function(results) {
            let fastpathStatus = _('Not Running');
            let fullconeStatus = _('Not Running');
            let bbrStatus = _('Not Running');

            if (results[0].code === 0 && results[0].stdout) {
                const fastpathOutput = results[0].stdout.trim();
                if ([
                    'Flow Offloading',
                    'MediaTek HWNAT',
                    'QCA-NSS-ECM',
                    'QCA-ECM-SFE',
                    'Shortcut-FE',
                    'Shortcut-FE ECM'
                ].includes(fastpathOutput)) {
                    fastpathStatus = _('Running');
                }
            }

            if (results[1].code === 0 && results[1].stdout.trim() === 'FullCone_NAT') {
                fullconeStatus = _('Running');
            }

            if (results[2].code === 0) {
                bbrStatus = results[2].stdout.trim() === 'BBR' ? _('Running') : _('Not Running');
            }

            return {
                fastpath: fastpathStatus,
                fullcone: fullconeStatus,
                bbr: bbrStatus
            };
        }).catch(function() {
            return {
                fastpath: _('Not Running'),
                fullcone: _('Not Running'),
                bbr: _('Not Running')
            };
        });
    },

    render: function(data) {
        var m, s, o;

        m = new form.Map('turboacc', _('Turbo ACC Acceleration Settings'),
            _('Opensource Flow Offloading driver (Fast Path or Hardware NAT)') +
    ' <a href="https://github.com/bauw2008/op1/tree/main/luci-app-turboacc-js" target="_blank">' + _('GitHub') + '</a>');

        s = m.section(form.TypedSection, 'status', _('Running Status'));
        s.anonymous = true;
        s.render = function () {
            return E('fieldset', { class: 'cbi-section' }, [
                E('legend', {}, _('Running Status')),
                E('table', { width: '100%', cellspacing: '10', id: '_turboacc_status_table' }, [
                    E('tr', {}, [
                        E('td', { width: '33%' }, _('Flow Offloading')),
                        E('td', { id: '_fastpath_state' }, E('em', {}, data.fastpath || _('Not Running')))
                    ]),
                    E('tr', {}, [
                        E('td', { width: '33%' }, _('FullCone NAT')),
                        E('td', { id: '_fullconenat_state' }, E('em', {}, data.fullcone || _('Not Running')))
                    ]),
                    E('tr', {}, [
                        E('td', { width: '33%' }, _('BBR CCA')),
                        E('td', { id: '_bbr_state' }, E('em', {}, data.bbr || _('Not Running')))
                    ])
                ])
            ]);
        };

        s = m.section(form.NamedSection, 'config', 'turboacc', _(''));
        s.addremove = false;
        s.anonymous = true;

        o = s.option(form.Flag, 'sw_flow', _('Software flow offloading'),
            _('Software based offloading for routing/NAT'));
        o.default = '0';

        o = s.option(form.Flag, 'hw_flow', _('Hardware flow offloading'),
            _('Requires hardware NAT support, implemented at least for mt762x'));
        o.default = '0';
        o.depends('sw_flow', '1');

        // o = s.option(form.Flag, 'sfe_flow', _('Shortcut-FE flow offloading'),
        // _('Shortcut-FE based offloading for routing/NAT'));
        o.default = '0'; 

        // o = s.option(form.Flag, 'hw_wed', _('MTK WED WO offloading'),
        //   _('Requires hardware support, implemented at least for Filogic 8x0'));
        // o.default = '0'; 

        o = s.option(form.Flag, 'fullcone_nat', _('FullCone NAT'),
            _('Using FullCone NAT can improve gaming performance effectively'));
        o.default = '0';

        o = s.option(form.Flag, 'fullcone6', _('IPv6 Full Cone NAT'),
            _('Enabling IPv6 Full Cone NAT adds an extra layer of NAT to IPv6. In IPv6, if you obtain an IPv6 prefix through IPv6 Prefix Delegation, each device can be assigned a public IPv6 address, eliminating the need for IPv6 Full Cone NAT.'));
        o.default = '0';

        o = s.option(form.Flag, 'bbr_cca', _('BBR CCA'),
            _('Using BBR CCA can improve TCP network performance effectively'));
        o.default = '0';

        return m.render();
    }
});

