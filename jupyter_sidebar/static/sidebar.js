/* jshint esnext: true, expr: true, sub: true, laxbreak: true */
/* eslint-env es6 */
/* global define */

define(
  [
    'require',
    'jquery',
    'base/js/namespace',
    'base/js/events',
    'base/js/utils',
    'nbextensions/jupyter_sidebar/resized-by'
  ],
  (require, $, env, events, utils) => {
    $('head').append(
      $('<link/>', {
        type: 'text/css',
        rel: 'stylesheet',
        href: require.toUrl('./sidebar.css')
      })
    );

    /**
     * A default config entry in config.data.Sidebar
     * @class SidebarConfigEntry
     * @param {Config}          config - notebook's config
     * @param {string}          id - id to search the config entry, empty
     *                          string to bypass config lookup
     * @param {Array}           defaults - with increasing precedence
     */
    function SidebarConfigEntry(config, id, ...defaults) {
      this.config = config;
      this.id = id;
      this.default = $.extend(true, {}, ...defaults);
    }

    SidebarConfigEntry.prototype.get = function(key) {
      return $.extend(
        true,
        {},
        this.default,
        this.config.data.Sidebar && this.config.data.Sidebar[this.id]
      )[key];
    };

    SidebarConfigEntry.prototype.set = function(...args) {
      if (args.length === 1) {
        for (var k in args[0]) {
          if (args[0].hasOwnProperty(k))
            SidebarConfigEntry.prototype.set.call(this, k, args[0][k]);
        }
      } else {
        if (this.id) this.config.update({ Sidebar: { [this.id]: { [args[0]]: args[1] } } });
        else this.default[args[0]] = args[1];
      }
    };

    const layout_adjust = () =>
      $('.sidebar_panel').each((i, sidebar) => $(sidebar).data('model').adjust_width());

    const layout_resort_and_adjust = () => {
      const widget_order = widget => $(widget).data('model').config.get('order');

      $('.sidebar_panel > .sidebar_widget').each((i, widget) => {
        const sidebar_id = $(widget).data('model').config.get('sidebar_id');
        if (!sidebar_id) return;
        const dest = $(`.sidebar_panel[data-id="${sidebar_id}"]`);
        if (dest.length > 0) dest.append(widget);
      });

      $('.sidebar_panel').each((i, sidebar) =>
        $(sidebar)
          .find('> .sidebar_widget')
          .toArray()
          .sort((a, b) => widget_order(a) - widget_order(b))
          .forEach(widget => $(sidebar).append(widget))
      );

      layout_adjust();
    };

    const main_app = $('#ipython-main-app');

    /**
     * Contains sidebar widgets
     * @class Sidebar
     * @param {object}          options - Dictionary of keyword arguments.
     * @param {object}          options.notebook
     * @param {string}          options.id
     * @param {string}          options.position - left|right
     * @param {float}           options.widgetAnimationDuration
     */
    function Sidebar({ notebook, id, position }) {
      this.id = id || utils.uuid();
      this.notebook = notebook;
      this.config = new SidebarConfigEntry(this.notebook.config, id, Sidebar.default_config, {
        position: position
      });
      Sidebar.prototype.create_element.call(this);
      layout_resort_and_adjust();
    }

    Sidebar.default_config = { width: 300, position: 'right' };

    // @final
    Sidebar.prototype.create_element = function() {
      this.resizer = $('<div/>', { class: 'resizer panel_resizer' });
      this.element = $('<div/>', { class: 'sidebar_panel' })
        .data('model', this)
        .resizedBy({
          handleSelector: this.resizer,
          resizeWidthFrom: this.config.get('position') === 'left' ? 'right' : 'left',
          resizeHeight: false,
          onDragEnd: () => this.config.set('width', this.element.width()),
          enable: () => !this.element.hasClass('collapsed')
        })
        .sortable({
          connectWith: '.sidebar_panel',
          items: '> .sidebar_widget',
          handle: '.sidebar_header',
          forcePlaceholderSize: true,
          tolerance: 'pointer',
          change: layout_adjust,
          update: Sidebar.prototype.set_widgets_config.bind(this)
        });
      this.element.get(0).dataset.id = this.id;
      this.handler = $('<div/>', { class: 'sidebar_handler' });
      this.element.append(this.handler);
      if (this.config.get('position') === 'left') {
        main_app.prepend([this.element, this.resizer]);
      } else {
        main_app.append([this.resizer, this.element]);
      }

      this.adjust_width();

      // Menu item
      // const toggle_sidebar_handle = () => $('.sidebar_panel, .resizer_panel').toggle(),
      //   toggle_sidebar = $(`
      // <li id="toggle_sidebar" title="Show/Hide sidebar">
      // <a href="#">Toggle Sidebar</a>
      // </li>`)
      //     .click(toggle_sidebar_handle)
      //     .appendTo($('#view_menu'));
      // env.actions.register(
      //   { handler: toggle_sidebar_handle },
      //   'toggle-sidebar',
      //   'notebook-sidebar'
      // );
    };

    // @final
    Sidebar.prototype.set_widgets_config = function() {
      console.log(this, 'set_widgets_config');
      this.element
        .find('> .sidebar_widget:not(.ui-sortable-placeholder)')
        .each((i, w) => $(w).data('model').config.set({ sidebar_id: this.id, order: i }));
    };

    Sidebar.prototype.adjust_width = function() {
      if (
        this.element.find(
          '> .sidebar_widget:not(.ui-sortable-helper), > .ui-sortable-placeholder'
        ).length > 0
      ) {
        this.element
          .removeClass('collapsed')
          .width(this.config.get('width'))
          .find('> .sidebar_widget')
          .show();
      } else {
        this.element
          .addClass('collapsed')
          .find('> .sidebar_widget:not(.ui-sortable-helper)')
          .hide();
      }
      return this;
    };

    Sidebar.prototype.add_widget = function(widget) {
      this.element.append(widget.element);
      layout_resort_and_adjust();
      return this;
    };

    /**
     * Base class for sidebar widget
     * @class Sidebar
     * @param {object}          options - Dictionary of keyword arguments.
     * @param {object}          options.notebook
     * @param {string}          options.header - used to generate widget id
     * @field {object}          this.config.get, this.config.set
     */
    function Widget({ notebook, header }) {
      this.id = header ? header.replace(/[ '"]/g, '-').toLowerCase() : utils.uuid();
      this.config = new SidebarConfigEntry(
        notebook.config,
        header ? this.id : null,
        Widget.default_config
      );
      Widget.prototype.create_element.call(this);
      Widget.prototype.update_header.call(this, header);
    }

    Widget.default_config = { order: Number.MAX_SAFE_INTEGER, collapsed: false };

    // @final
    Widget.prototype.create_element = function() {
      this.element = $('<div/>', { class: 'sidebar_widget' }).data('model', this);
      this.element.get(0).dataset.id = this.id;
      this.header = $('<div/>', { class: 'sidebar_header sidebar_text' }).click(
        () => (this.config.get('collapsed') ? this.expand() : this.collapse())
      );
      this.body = $('<div/>', { class: 'sidebar_body' });
      this.element.append([this.header, this.body]);
      if (this.config.get('collapsed')) this.collapse();
    };

    Widget.prototype.update_header = function(html) {
      this.header.html(html);
      return this;
    };

    Widget.prototype.expand = function() {
      this.element.removeClass('collapsed');
      this.config.set('collapsed', false);
    };

    Widget.prototype.collapse = function() {
      this.element.addClass('collapsed');
      this.config.set('collapsed', true);
    };

    Widget.prototype.detach = function() {
      const parent = this.element.closest('.sidebar_panel');
      this.element.detach();
      if (parent) $(parent).data('model').adjust_width();
      return this;
    };

    Widget.prototype.remove = function() {
      Widget.prototype.detach.call(this).element.remove();
    };

    /**
     * Table widget
     * @class Table
     * @param {object}          options - Dictionary of keyword arguments.
     * @param {object}          options.notebook
     * @param {string}          options.header
     * @param {int}             options.nColumn
     * @param {string}          options.info
     */
    function Table(options) {
      Widget.call(this, options);
      this.data = [];
      this.onRender = d => d;
      this.onSort = null;
      this.sortIndex = 0;
      this.ascendant = true;

      Table.prototype.create_element.call(this, options);
      Table.prototype.update_info.call(this, options.info);
    }

    Table.prototype = Object.create(Widget.prototype);
    Table.prototype.constructor = Table;

    // @final
    Table.prototype.create_element = function({ nColumn }) {
      const tbody = $('<div/>', { class: 'sidebar_table_body' });
      this.info = $('<div/>', { class: 'sidebar_table_info sidebar_text' });
      this.body.append([tbody, this.info]);
      this.columns = [];
      for (var i = 0; i < nColumn; i++) {
        const col = $('<div/>', { class: 'sidebar_table_column' }).data('index', i);
        tbody.append(col);
        this.columns.push(col);
        if (i !== nColumn - 1) {
          const resizer = $('<div/>', { class: 'resizer' });
          col.resizedBy({ handleSelector: resizer, resizeHeight: false });
          tbody.append(resizer);
        }
      }
      const that = this;
      tbody.find('> .sidebar_table_column').click(function() {
        that.update({ sortIndex: $(this).data('index') });
      });
    };

    Table._get_compare_func = func => {
      return func.length < 2
        ? (x, y) => {
            const ix = func(x),
              iy = func(y);
            return ix < iy ? -1 : ix > iy ? 1 : 0;
          }
        : func;
    };

    /**
     * Update content of table
     * @class Table
     * @param {object}          options - Dictionary of keyword arguments.
     * @param {Array}           options.data
     * @param {function}        options.onRender
     * @param {Array}           options.onSort - contains compareFunctions or
     *                          indexFunctions
     * @param {int}             options.sortIndex
     */
    Table.prototype.update = function({ data, onRender, onSort, sortIndex }) {
      this.ascendant =
        !data && !onSort && sortIndex === this.sortIndex ? !this.ascendant : true;
      $.extend(this, { data: data, onRender: onRender, onSort: onSort, sortIndex: sortIndex });
      this.data.sort(this.onSort && Table._get_compare_func(this.onSort[this.sortIndex]));

      this.columns.forEach(c => c.empty());
      this.data.forEach(d =>
        this.onRender(d).forEach((c, i) => {
          if (i < this.columns.length) {
            const cell = $('<div/>', { html: c, class: 'sidebar_table_cell sidebar_text' });
            if (this.ascendant) {
              this.columns[i].append(cell);
            } else {
              this.columns[i].prepend(cell);
            }
          }
        })
      );
      return this;
    };

    Table.prototype.update_info = function(info) {
      if (info) {
        this.info.html(info).show();
      } else {
        this.info.html('').hide();
      }
      return this;
    };

    /**
     * CommandOutput widget
     * @class CommandOutput
     * @param {object}          options - Dictionary of keyword arguments.
     * @param {string}          options.header
     * @param {object}          options.notebook
     * @param {object}          options.events
     * @param {string}          options.command
     */
    function CommandOutput(options) {
      Widget.call(this, options);
      this.notebook = options.notebook;
      this.events = options.events;
      this.command = options.command;

      CommandOutput.prototype.create_element.call(this);

      this.callback = () => {
        if (this.config.get('collapsed')) return;
        call_kernel({ notebook: this.notebook, command: this.command }).then(text =>
          this.output.text(text)
        );
      };
      CommandOutput.prototype.bind_events.call(this);
    }

    CommandOutput.prototype = Object.create(Widget.prototype);
    CommandOutput.prototype.constructor = CommandOutput;

    // @final
    CommandOutput.prototype.create_element = function() {
      this.output = $('<div/>', { class: 'sidebar_line sidebar_text' });
      this.output.css({ 'white-space': 'pre-wrap', 'word-break': 'break-all' });
      this.body.append(this.output);
    };

    // @final
    CommandOutput.prototype.bind_events = function() {
      this.events.on('kernel_ready.Kernel', this.callback);
      this.events.on('finished_execute.CodeCell', this.callback);
      if (this.notebook.kernel !== null) this.callback();
    };

    // @final
    CommandOutput.prototype.unbind_events = function() {
      this.events.off('kernel_ready.Kernel', this.callback);
      this.events.off('finished_execute.CodeCell', this.callback);
    };

    CommandOutput.prototype.expand = function() {
      Widget.prototype.expand.call(this);
      this.callback();
    };

    CommandOutput.prototype.remove = function() {
      CommandOutput.prototype.unbind_events.call(this);
      Widget.prototype.remove.call(this);
    };

    /**
     * Helper function to execute script
     * @param {object}          options.notebook
     * @param {string}          options.command
     */
    const call_kernel = ({ notebook, command }) =>
      new Promise((rsl, rjt) => {
        var stdout = '',
          stderr = '';
        const msg_id = notebook.kernel.execute(command, {
          iopub: {
            output: r => {
              if (r.parent_header.msg_id !== msg_id) return;
              if (r.msg_type === 'stream') stdout += r.content.text;
              else rjt(r);
            }
          },
          shell: {
            reply: r => {
              if (r.parent_header.msg_id !== msg_id) return;
              if (r.content.status === 'ok') rsl(stdout);
              else rjt(r);
            }
          }
        });
      });

    const create_sidebar = id => {
      const n = $('.sidebar_panel').length;
      return new Sidebar({
        notebook: env.notebook,
        id: id || `sidebar-${n}`,
        position: n % 2 ? 'left' : 'right'
      });
    };

    const create_command_output = (header, command) =>
      new CommandOutput({
        notebook: env.notebook,
        events: events,
        header: header,
        command: command
      });

    return {
      Sidebar: Sidebar,
      Widget: Widget,
      Table: Table,
      CommandOutput: CommandOutput,
      call_kernel: call_kernel,
      create_sidebar: create_sidebar,
      create_command_output: create_command_output
    };
  }
);
