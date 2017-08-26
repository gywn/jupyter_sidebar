/* jshint esnext: true, expr: true, sub: true */
/* eslint-env es6 */
/* global define */

define(
  ['nbextensions/jupyter_sidebar/sidebar', 'nbextensions/jupyter_sidebar/numpy'],
  (sidebarmod, sidebar_numpy) => {
    // Sidebars are added in order of right-left-right-left...
    const right_sidebar = sidebarmod.create_sidebar();
    const left_sidebar = sidebarmod.create_sidebar();

    // Create and add the Numpy variables inspector
    const np_table = sidebar_numpy.create_numpy_table();
    right_sidebar.add_widget(np_table);

    // Create and add the welcoming message
    const msg = sidebarmod.create_command_output(
      'Welcoming Message',
      `
def __jsb_msg():
  from jupyter_core.paths import jupyter_data_dir, jupyter_path
  import os
  for dir in [jupyter_data_dir()] + jupyter_path():
      path = os.path.join(dir, 'nbextensions/jupyter_sidebar/default.js')
      if (os.path.isfile(path)):
          print("""You can turn off this message in default.js located at:

    {0}

or disable the default setting by running:

    jupyter nbextension disable jupyter_sidebar/default

and write your own setting.""".format(path))
          break
__jsb_msg()`
    );
    right_sidebar.add_widget(msg);

    // Uncomment this line to turn off the message
    // msg.remove();
  }
);
