  import { AnimatePresence, motion } from 'framer-motion';
  import { X } from 'lucide-react';
  import type { ReactNode } from 'react';
  import { useEffect } from 'react';

  type ModalSize =
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'full';

  export function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    size = 'md',
  }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: ModalSize;
  }) {
    useEffect(() => {
      if (!open) return;

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, onClose]);

    const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-[95vw] lg:max-w-[1100px]',
    full: 'max-w-[98vw] lg:max-w-[1500px]',
  };

    return (
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={onClose}
            />

            

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{
                type: 'spring',
                stiffness: 360,
                damping: 32,
              }}
              style={{
      touchAction: 'pan-y',
              }}
              className={`
      relative
      flex
    h-[95vh]
      w-full
      flex-col
      overflow-hidden
      rounded-t-2xl
      bg-white
      shadow-2xl
      dark:bg-slate-900
      sm:rounded-2xl
      ${sizes[size]}
    `}
              
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h2>

                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
            <div
    className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 lg:px-8"
    style={{
      WebkitOverflowScrolling: 'touch',
      touchAction: 'pan-y',
    }}
  >
    {children}
  </div>

              {/* Footer */}
              {footer && (
                <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    danger = false,
  }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
  }) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={title}
        size="xl"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className={`${danger ? 'btn-danger' : 'btn-primary'} flex-1`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmLabel}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {message}
        </p>
      </Modal>
    );
  }