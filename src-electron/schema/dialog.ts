export type DialogOptions = {
  title?: string;

  defaultPath?: string;

  /**
   * Custom label for the confirmation button, when left empty the default label will
   * be used.
   */
  buttonLabel?: string;

  /**
   * Message to display above input boxes.
   *
   * @platform darwin
   */
  message?: string;
};
