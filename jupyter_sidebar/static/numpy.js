/* jshint esnext: true, expr: true, sub: true, laxbreak: true */
/* eslint-env es6 */
/* global define */

define(
  ['jquery', 'base/js/namespace', 'base/js/events', 'nbextensions/jupyter_sidebar/sidebar'],
  ($, env, events, sidebarmod) => {
    /**
     * Numpy Variable Inspector widget
     * @class NumpyTable 
     * @param {object}          options - Dictionary of keyword arguments.  
     * @param {object}          options.notebook 
     * @param {object}          options.events 
     * @param {int}             options.nColumn
     */
    const Table = sidebarmod.Table;

    function NumpyTable({ notebook, events }) {
      Table.call(this, {
        notebook: notebook,
        header: 'Numpy Variables Inspector',
        nColumn: 4
      });
      this.notebook = notebook;
      this.events = events;

      this.update.call(this, {
        onRender: ([module, name, type, shape, addr]) => [
          (module === '__main__' ? '' : `<span class=jsb_module>${module}.</span>`) + name,
          `<span class='jsb_type ${NumpyTable._get_type_class(type)}'>${type}</span>`,
          shape.join('\u2009<span class=jsb_multi>\u00d7</span>\u2009'),
          '<span class=jsb_addr_prefix>0x</span>\u200a' + (+addr).toString(16).padStart(16, '0')
        ],
        onSort: [
          ([module, name, type, shape, addr]) => [module === '__main__' ? 0 : 1, module, name],
          ([module, name, type, shape, addr]) => type,
          ([module, name, type, shape, addr]) => shape.reduce((sum, dim) => sum * dim, -1),
          ([module, name, type, shape, addr]) => addr
        ],
        sortIndex: 3
      });

      this.callback = () => {
        if (this.config.get('collapsed')) return;
        this.update_from_kernel();
      };
      NumpyTable.prototype.bind_events.call(this);
    }

    NumpyTable.prototype = Object.create(Table.prototype);
    NumpyTable.prototype.constructor = NumpyTable;

    NumpyTable._get_type_class = type =>
      'jsb_' +
      {
        '?': 'bool',
        e: 'float', d: 'float', f: 'float', g: 'float',
        D: 'complex', F: 'complex', G: 'complex',
        B: 'uint', H: 'uint', I: 'uint', L: 'uint', M: 'uint', Q: 'uint',
        b: 'int', h: 'int', i: 'int', l: 'int', m: 'int', q: 'int',
        S: 'string', U: 'string',
        O: 'other', V: 'other'
      }[type];

    NumpyTable.prototype._shell_reply_handler = function(text) {
      const data = JSON.parse(text);
      this.update.call(this, { data: data });
      this.update_info.call(this, data.length === 0 ? 'No Numpy variable' : '');
    };

    NumpyTable.prototype.update_from_kernel = function() {
      const command = `
from jupyter_sidebar.numpy import report as _jsb_numpy_report
_jsb_numpy_report()`;
      sidebarmod
        .call_kernel({ notebook: this.notebook, command: command })
        .then(NumpyTable.prototype._shell_reply_handler.bind(this));
    };

    // @final
    NumpyTable.prototype.bind_events = function() {
      this.events.on('kernel_ready.Kernel', this.callback);
      this.events.on('finished_execute.CodeCell', this.callback);
      if (this.notebook.kernel !== null) this.callback();
    };

    // @final
    NumpyTable.prototype.unbind_events = function() {
      this.events.off('kernel_ready.Kernel', this.callback);
      this.events.off('finished_execute.CodeCell', this.callback);
    };

    NumpyTable.prototype.expand = function() {
      sidebarmod.Widget.prototype.expand.call(this);
      this.callback();
    };

    NumpyTable.prototype.remove = function() {
      NumpyTable.prototype.unbind_events.call(this);
      Table.prototype.remove.call(this);
    };

    const create_numpy_table = () => new NumpyTable({ notebook: env.notebook, events: events });

    return { NumpyTable: NumpyTable, create_numpy_table: create_numpy_table };
  }
);
