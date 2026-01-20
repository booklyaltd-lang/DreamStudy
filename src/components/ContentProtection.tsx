import { useEffect } from 'react';

export function ContentProtection() {
  useEffect(() => {
    // Блокировка контекстного меню (правый клик)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Блокировка выделения текста
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Блокировка копирования
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Блокировка вырезания
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // Блокировка сохранения страницы
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S (сохранение)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        return false;
      }
      // Ctrl+C (копирование)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        return false;
      }
      // Ctrl+X (вырезание)
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        return false;
      }
      // Ctrl+A (выделить все)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        return false;
      }
      // Ctrl+P (печать)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        return false;
      }
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (инструменты разработчика)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J')) ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Блокировка перетаскивания изображений
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Добавляем обработчики событий
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    // Блокировка выделения для всех изображений и видео
    const preventImageSave = () => {
      const images = document.querySelectorAll('img');
      const videos = document.querySelectorAll('video');

      images.forEach((img) => {
        img.style.pointerEvents = 'none';
        img.style.userSelect = 'none';
        img.setAttribute('draggable', 'false');
        img.addEventListener('contextmenu', handleContextMenu);
      });

      videos.forEach((video) => {
        video.style.pointerEvents = 'none';
        video.style.userSelect = 'none';
        video.setAttribute('controlsList', 'nodownload');
        video.addEventListener('contextmenu', handleContextMenu);
      });
    };

    // Применяем защиту при загрузке
    preventImageSave();

    // Отслеживаем добавление новых элементов
    const observer = new MutationObserver(preventImageSave);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Отключаем консоль (дополнительная защита)
    const disableConsole = () => {
      if (import.meta.env.PROD) {
        console.log = () => {};
        console.warn = () => {};
        console.error = () => {};
        console.info = () => {};
        console.debug = () => {};
      }
    };
    disableConsole();

    // Очистка обработчиков при размонтировании
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      observer.disconnect();
    };
  }, []);

  return null;
}
