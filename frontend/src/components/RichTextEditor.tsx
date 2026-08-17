'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Table as TableIcon,
  Eraser,
  Loader2,
  X,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { getApiUrl, getMediaUrl } from '@/lib/api';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung bài viết / thông báo...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // State Phóng to / Thu gọn khung soạn thảo
  const [isExpanded, setIsExpanded] = useState(false);

  // State Hộp thoại chèn ảnh báo chí
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageSize, setImageSize] = useState<'100%' | '75%' | '50%'>('100%');
  const [imageAlign, setImageAlign] = useState<'center' | 'left' | 'right'>('center');
  const [dangUploadAnh, setDangUploadAnh] = useState(false);

  const [activeFormat, setActiveFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  // Lưu vị trí con trỏ trong editor
  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Phục hồi vị trí con trỏ
  const restoreSelection = () => {
    if (typeof window === 'undefined' || !savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  // Đồng bộ value từ bên ngoài vào editor khi mount hoặc thay đổi ngoài luồng
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html === '<br>' ? '' : html);
      checkActiveFormats();
    }
  };

  const execCmd = (command: string, valueArg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, valueArg);
    emitChange();
  };

  const checkActiveFormats = () => {
    try {
      setActiveFormat({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // Ignore if queryCommandState fails
    }
  };

  // Thêm Link
  const handleAddLink = () => {
    saveSelection();
    const url = window.prompt('Nhập địa chỉ liên kết (URL):', 'https://');
    if (url && url !== 'https://') {
      restoreSelection();
      execCmd('createLink', url);
    }
  };

  // Thêm Bảng (Responsive Table)
  const handleAddTable = () => {
    const tableHtml = `
      <div class="overflow-x-auto my-4">
        <table class="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs my-2">
          <thead>
            <tr class="bg-slate-100 dark:bg-slate-800">
              <th class="p-2 border border-slate-300 dark:border-slate-700 font-bold">Tiêu đề 1</th>
              <th class="p-2 border border-slate-300 dark:border-slate-700 font-bold">Tiêu đề 2</th>
              <th class="p-2 border border-slate-300 dark:border-slate-700 font-bold">Tiêu đề 3</th>
            </tr>
          </thead>
          <tbody>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td class="p-2 border border-slate-300 dark:border-slate-700">Nội dung 1</td>
              <td class="p-2 border border-slate-300 dark:border-slate-700">Nội dung 2</td>
              <td class="p-2 border border-slate-300 dark:border-slate-700">Nội dung 3</td>
            </tr>
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td class="p-2 border border-slate-300 dark:border-slate-700">Nội dung 4</td>
              <td class="p-2 border border-slate-300 dark:border-slate-700">Nội dung 5</td>
              <td class="p-2 border border-slate-300 dark:border-slate-700">Nội dung 6</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p><br></p>
    `;
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      const success = document.execCommand('insertHTML', false, tableHtml);
      if (!success) {
        editorRef.current.innerHTML += tableHtml;
      }
      emitChange();
    }
  };

  // Chọn file từ máy tính
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowImageModal(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Xác nhận Upload Ảnh Báo Chí
  const handleConfirmImageUpload = async () => {
    if (!selectedFile) return;

    try {
      setDangUploadAnh(true);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('token') || '') : '';
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(getApiUrl('/api/v1/tep-tin/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      const pathUrl = data.du_lieu?.url || data.du_lieu?.duong_dan;
      if (!res.ok || !data.thanh_cong || !pathUrl) {
        alert(data.message || data.thong_bao || 'Tải ảnh lên thất bại');
        return;
      }

      const imageUrl = getMediaUrl(pathUrl);
      const cleanCaption = imageCaption.trim();

      let imgHtml = '';
      if (imageAlign === 'center') {
        imgHtml = `
          <figure class="my-5 text-center clear-both">
            <img src="${imageUrl}" alt="${cleanCaption || 'Ảnh nội dung'}" style="max-width: ${imageSize}; width: 100%; height: auto;" class="rounded-2xl mx-auto inline-block border border-slate-200 dark:border-slate-800 shadow-md" />
            ${cleanCaption ? `<figcaption class="text-xs text-slate-500 dark:text-slate-400 italic mt-2 font-medium">${cleanCaption}</figcaption>` : ''}
          </figure>
          <p><br></p>
        `;
      } else if (imageAlign === 'left') {
        imgHtml = `
          <figure class="my-3 mr-5 mb-3 float-left clear-left text-center" style="max-width: ${imageSize}; width: 100%;">
            <img src="${imageUrl}" alt="${cleanCaption || 'Ảnh nội dung'}" class="w-full h-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md" />
            ${cleanCaption ? `<figcaption class="text-xs text-slate-500 dark:text-slate-400 italic mt-1.5 font-medium">${cleanCaption}</figcaption>` : ''}
          </figure>
          <p><br></p>
        `;
      } else {
        imgHtml = `
          <figure class="my-3 ml-5 mb-3 float-right clear-right text-center" style="max-width: ${imageSize}; width: 100%;">
            <img src="${imageUrl}" alt="${cleanCaption || 'Ảnh nội dung'}" class="w-full h-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md" />
            ${cleanCaption ? `<figcaption class="text-xs text-slate-500 dark:text-slate-400 italic mt-1.5 font-medium">${cleanCaption}</figcaption>` : ''}
          </figure>
          <p><br></p>
        `;
      }

      if (editorRef.current) {
        editorRef.current.focus();
        restoreSelection();
        const success = document.execCommand('insertHTML', false, imgHtml);
        if (!success) {
          editorRef.current.innerHTML += imgHtml;
        }
        emitChange();
      }

      // Reset modal state
      setShowImageModal(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setImageCaption('');
      setImageSize('100%');
      setImageAlign('center');
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối khi tải ảnh lên');
    } finally {
      setDangUploadAnh(false);
    }
  };

  // Nút Format trong Toolbar
  const ToolbarButton = ({
    title,
    icon: Icon,
    onClick,
    active = false,
    disabled = false,
  }: {
    title: string;
    icon: React.ElementType;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${active
        ? 'bg-[#E97036] text-white border-[#E97036] shadow-sm'
        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
        } disabled:opacity-40`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-950 transition-colors shadow-sm relative">
      {/* Hidden File Input cho Upload Ảnh */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleSelectFile}
        className="hidden"
      />

      {/* TOOLBAR */}
      <div className="p-2 sm:p-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5 sticky top-0 z-10">
        {/* Undo / Redo */}
        <ToolbarButton title="Hoàn tác (Undo)" icon={Undo} onClick={() => execCmd('undo')} />
        <ToolbarButton title="Làm lại (Redo)" icon={Redo} onClick={() => execCmd('redo')} />

        <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Format Chữ */}
        <ToolbarButton
          title="In đậm (Bold)"
          icon={Bold}
          active={activeFormat.bold}
          onClick={() => execCmd('bold')}
        />
        <ToolbarButton
          title="In nghiêng (Italic)"
          icon={Italic}
          active={activeFormat.italic}
          onClick={() => execCmd('italic')}
        />
        <ToolbarButton
          title="Gạch chân (Underline)"
          icon={Underline}
          active={activeFormat.underline}
          onClick={() => execCmd('underline')}
        />
        <ToolbarButton
          title="Gạch ngang (Strikethrough)"
          icon={Strikethrough}
          active={activeFormat.strikeThrough}
          onClick={() => execCmd('strikeThrough')}
        />

        <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Kiểu thẻ / Heading */}
        <select
          title="Kiểu văn bản"
          onChange={(e) => execCmd('formatBlock', e.target.value)}
          className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-[#E97036]"
          defaultValue="<p>"
        >
          <option value="<p>">Đoạn văn (Normal)</option>
          <option value="<h1>">Tiêu đề 1 (H1)</option>
          <option value="<h2>">Tiêu đề 2 (H2)</option>
          <option value="<h3>">Tiêu đề 3 (H3)</option>
        </select>

        {/* Cỡ chữ */}
        <select
          title="Cỡ chữ"
          onChange={(e) => execCmd('fontSize', e.target.value)}
          className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-[#E97036]"
          defaultValue="3"
        >
          <option value="1">Nhỏ (12px)</option>
          <option value="3">Vừa (14px)</option>
          <option value="4">Lớn (16px)</option>
          <option value="5">Rất lớn (18px)</option>
          <option value="6">Siêu lớn (24px)</option>
        </select>

        <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Căn lề */}
        <ToolbarButton
          title="Căn trái"
          icon={AlignLeft}
          active={activeFormat.justifyLeft}
          onClick={() => execCmd('justifyLeft')}
        />
        <ToolbarButton
          title="Căn giữa"
          icon={AlignCenter}
          active={activeFormat.justifyCenter}
          onClick={() => execCmd('justifyCenter')}
        />
        <ToolbarButton
          title="Căn phải"
          icon={AlignRight}
          active={activeFormat.justifyRight}
          onClick={() => execCmd('justifyRight')}
        />
        <ToolbarButton
          title="Căn đều 2 bên"
          icon={AlignJustify}
          active={activeFormat.justifyFull}
          onClick={() => execCmd('justifyFull')}
        />

        <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Danh sách */}
        <ToolbarButton
          title="Danh sách dấu chấm"
          icon={List}
          active={activeFormat.insertUnorderedList}
          onClick={() => execCmd('insertUnorderedList')}
        />
        <ToolbarButton
          title="Danh sách đánh số"
          icon={ListOrdered}
          active={activeFormat.insertOrderedList}
          onClick={() => execCmd('insertOrderedList')}
        />
        <ToolbarButton
          title="Trích dẫn (Quote)"
          icon={Quote}
          onClick={() => execCmd('formatBlock', 'blockquote')}
        />

        <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Link, Ảnh, Bảng */}
        <ToolbarButton title="Chèn liên kết (Link)" icon={LinkIcon} onClick={handleAddLink} />
        <ToolbarButton
          title="Chèn ảnh từ máy tính (Không giới hạn)"
          icon={ImageIcon}
          onClick={() => {
            saveSelection();
            fileInputRef.current?.click();
          }}
        />
        <ToolbarButton title="Chèn Bảng (Table)" icon={TableIcon} onClick={handleAddTable} />

        <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Clear Format */}
        <ToolbarButton
          title="Xóa định dạng (Clear Format)"
          icon={Eraser}
          onClick={() => execCmd('removeFormat')}
        />

        <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Nút Phóng to / Thu gọn chiều cao Khung soạn thảo */}
        <button
          type="button"
          title={isExpanded ? 'Thu gọn khung soạn thảo' : 'Phóng to khung soạn thảo'}
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
        >
          {isExpanded ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Thu gọn</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Phóng to</span>
            </>
          )}
        </button>
      </div>

      {/* VÙNG SOẠN THẢO CONTENTEDITABLE - CHO PHÉP KÉO GIÃN CHIỀU CAO (RESIZE-Y) VÀ THU GỌN MẶC ĐỊNH */}
      <div
        ref={editorRef}
        contentEditable
        onInput={emitChange}
        onKeyUp={() => {
          saveSelection();
          checkActiveFormats();
        }}
        onMouseUp={() => {
          saveSelection();
          checkActiveFormats();
        }}
        onBlur={() => {
          saveSelection();
          emitChange();
        }}
        style={{ minHeight: minHeight || '200px', height: isExpanded ? '540px' : '300px', maxHeight: '600px' }}
        data-placeholder={placeholder}
        className="p-4 focus:outline-none text-slate-900 dark:text-slate-100 text-sm leading-relaxed prose dark:prose-invert max-w-none resize-y overflow-auto min-h-[200px] max-h-[600px]"
      />

      {/* MODAL CẤU HÌNH CHÈN ẢNH BÁO CHÍ */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#E97036]" />
                Tùy chỉnh chèn ảnh Báo chí
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedFile(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PREVIEW ẢNH */}
            {previewUrl && (
              <div className="w-full h-44 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800">
                <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
              </div>
            )}

            {/* NHẬP CHÚ THÍCH ẢNH (CAPTION) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chú thích ảnh (Caption)
              </label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Ví dụ: Hình 1: Lễ khai giảng năm học mới..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#E97036]"
              />
            </div>

            {/* CĂN LỀ & KÍCH THƯỚC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vị trí căn lề
                </label>
                <select
                  value={imageAlign}
                  onChange={(e) => setImageAlign(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#E97036]"
                >
                  <option value="center">↔️ Căn giữa (Chuẩn báo)</option>
                  <option value="left">⬅️ Căn trái (Chữ bao quanh)</option>
                  <option value="right">➡️ Căn phải (Chữ bao quanh)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kích thước hiển thị
                </label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#E97036]"
                >
                  <option value="100%">100% (Toàn chiều rộng)</option>
                  <option value="90%">90% (Khung vừa)</option>
                  <option value="80%">80% (Khung vừa)</option>
                  <option value="75%">75% (Khung vừa)</option>
                  <option value="50%">50% (Khung nhỏ)</option>
                </select>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={dangUploadAnh}
                onClick={handleConfirmImageUpload}
                className="px-4 py-2 rounded-xl bg-[#E97036] hover:bg-[#d85f25] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {dangUploadAnh ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Chèn ảnh vào bài</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
