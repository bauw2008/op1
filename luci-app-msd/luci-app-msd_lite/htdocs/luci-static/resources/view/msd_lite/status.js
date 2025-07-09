'use strict';
'require view';
'require uci';
'require fs';
'require ui';

return view.extend({
  load() {
    return uci.load('msd_lite').then(() => {
      const sec = uci.sections('msd_lite').find(s => s['.type'] === 'instance' && s.address);
      if (!sec) return Promise.resolve('');
      const addr = Array.isArray(sec.address) ? sec.address[0] : sec.address;
      const url = 'http://' + addr.replace(/^\[|\]$/g, '') + '/stat';

      return fs.exec_direct('/usr/bin/wget', ['-q', url, '-O', '-'])
        .then(res => res || '')
        .catch(() => '');
    });
  },

    // 👇 禁用保存/应用/重置按钮
    handleSave: null,
    handleSaveApply: null,
    handleReset: null,

    // 渲染状态信息为 HTML
    render(statText) {
        statText = (statText || '').trim();
        if (!statText) {
            return E('span', { style: 'color: red' }, [_('msd_lite'), ' ', _('NOT RUNNING')]);
        }

    // 中文翻译表
    const translate = {
      'Server': '服务器信息',
      'start time': '启动时间',
      'running time': '运行时间',
      'connections online': '在线连接数',
      'timeouts': '超时数',
      'errors': '错误数',
      'HTTP errors': 'HTTP错误数',
      'insecure requests': '不安全请求',
      'unhandled requests (404)': '未处理请求(404)',
      'requests per sec': '每秒请求数',
      'requests total': '总请求数',

      'Per Thread stat': '线程统计',
      'Summary': '汇总信息',
      'Res usage': '资源使用',
      'Limits': '限制信息',
      'System info': '系统信息',
      'Hardware': '硬件信息',

      'Stream hub count': '流集线器数量',
      'Clients count': '客户端数量',
      'Rate in': '输入速率',
      'Rate out': '输出速率',
      'Total rate': '总速率',

      'CPU usage system': 'CPU系统使用率',
      'CPU usage user': 'CPU用户使用率',
      'CPU usage total': 'CPU总使用率',
      'Max resident set size': '最大常驻集大小',
      'Integral shared text memory size': '共享代码内存大小',
      'Integral unshared data size': '非共享数据大小',
      'Integral unshared stack size': '非共享栈大小',
      'Page reclaims': '页回收数',
      'Page faults': '缺页数',
      'Swaps': '交换次数',
      'Block input operations': '块输入操作',
      'Block output operations': '块输出操作',
      'IPC messages sent': 'IPC消息发送数',
      'IPC messages received': 'IPC消息接收数',
      'Signals received': '接收信号数',
      'Voluntary context switches': '主动上下文切换',
      'Involuntary context switches': '被动上下文切换',

      'CPU count': 'CPU核数',
      'IOV maximum': 'IOV最大数',
      'Max open files': '最大打开文件数',
      'Virtual memory max map': '虚拟内存最大映射',
      'mlock max size': 'mlock最大大小',
      'Data segment max size': '数据段最大大小',
      'Resident set max size': '常驻集最大大小',
      'Stack segment max size': '栈段最大大小',
      'CPU time max': 'CPU时间最大值',
      'File size max': '文件大小最大值',
      'Core file max size': '核心文件最大值',
      'Processes max count': '最大进程数',
	  
	  'Thread': '线程',
	  '@ cpu': '使用CPU',
	  'OS': '操作系统',
	  'Hostname': '主机名',
	  'Version': '版本',
	  
	  'Model': '型号',
	  'Clockrate': '主频',
	  'Phys mem': '物理内存',
	  
	  'mbps': '兆位每秒',
	  'mb': '兆字节'
	  
    };

    // 创建兼容LuCI的折叠区块
    function createLuCICollapsible(title, content, expanded) {
      const container = E('div', { class: 'cbi-section' });
      const header = E('div', {
        class: 'cbi-section-header',
        style: 'cursor:pointer;'
      }, [
        E('span', { 
          class: 'cbi-section-arrow',
          style: expanded ? 'transform:rotate(90deg);' : ''
        }, '▶'),
        E('h3', { style: 'display:inline; margin-left:5px;' }, title)
      ]);

      const contentDiv = E('div', {
        class: 'cbi-section-content',
        style: expanded ? '' : 'display:none;'
      }, content);

      header.addEventListener('click', function() {
        const isHidden = contentDiv.style.display === 'none';
        contentDiv.style.display = isHidden ? '' : 'none';
        header.querySelector('.cbi-section-arrow').style.transform = 
          isHidden ? 'rotate(90deg)' : '';
      }, false);

      container.appendChild(header);
      container.appendChild(contentDiv);
      return container;
    }

    // 渲染键值表格
    function renderKeyValueTable(lines) {
      const rows = [];
      lines.forEach(line => {
        const sep = line.indexOf(':');
        if (sep < 0) return;
        const key = line.slice(0, sep).trim();
        const val = line.slice(sep + 1).trim();
        rows.push(E('tr', {}, [
          E('td', { 
            style: 'font-weight:bold; padding:4px; border:1px solid #ddd; width:40%;' 
          }, translate[key] || key),
          E('td', { style: 'padding:4px; border:1px solid #ddd;' }, val)
        ]));
      });
      return E('table', { 
        style: 'border-collapse:collapse; width:100%; margin-top:5px;'
      }, rows);
    }

    // 分割不同区块
    const blocks = statText.split(/(?=\b(?:Server|Per Thread stat|Summary|Res usage|Limits|System info|Hardware)\b)/)
      .map(b => b.trim()).filter(Boolean);

    const container = E('div', { class: 'cbi-map' });

    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const originalTitle = lines[0];
      const content = lines.slice(1);
      
      if (originalTitle.startsWith('Server')) {
        // 处理Server行内容
        const serverInfoLine = originalTitle.slice('Server:'.length).trim();
        const allContent = [
          '服务器信息:' + serverInfoLine,
          ...content
        ];
        
        // 创建基础信息区块，使用折叠组件，默认展开
        container.appendChild(
          createLuCICollapsible(
            '状态',
            renderKeyValueTable(allContent),
            true  // 默认展开
          )
        );
      } else {
        // 其他区块正常处理，默认折叠
        container.appendChild(
          createLuCICollapsible(
            translate[originalTitle] || originalTitle,
            renderKeyValueTable(content),
            false  // 默认折叠
          )
        );
      }
    });

    return container;
  }
});
