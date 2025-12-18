/**
 * Internationalization (i18n) support for node-janitor
 */

export type Language = 'en' | 'vi' | 'zh' | 'ja' | 'ko' | 'es' | 'fr' | 'de';

export interface Translations {
    // General
    found: string;
    folders: string;
    scanning: string;
    noFolders: string;
    cancelled: string;
    goodbye: string;

    // Actions
    deleting: string;
    deleted: string;
    freed: string;
    cleaning: string;
    deepCleaning: string;
    processed: string;
    removed: string;
    files: string;

    // Prompts
    scanPath: string;
    ageFilter: string;
    confirmDelete: string;
    viewList: string;
    selectAction: string;

    // Reports
    report: string;
    totalFolders: string;
    totalSize: string;
    oldest: string;
    newest: string;
    breakdown: string;
    recommendations: string;

    // Errors
    scanFailed: string;
    errors: string;

    // Options
    dryRunMode: string;
    backupSaved: string;
}

const translations: Record<Language, Translations> = {
    en: {
        found: 'Found',
        folders: 'node_modules folders',
        scanning: 'Scanning',
        noFolders: 'No node_modules folders found.',
        cancelled: 'Cancelled.',
        goodbye: 'Goodbye!',

        deleting: 'Deleting',
        deleted: 'Deleted',
        freed: 'Freed',
        cleaning: 'Cleaning',
        deepCleaning: 'Deep Cleaning',
        processed: 'Processed',
        removed: 'Removed',
        files: 'files',

        scanPath: 'Enter path to scan:',
        ageFilter: 'Filter by age (e.g., 30d, 3m) or press Enter to skip:',
        confirmDelete: 'Delete these folders?',
        viewList: 'View folder list?',
        selectAction: 'Select action:',

        report: 'Node Modules Report',
        totalFolders: 'Total Folders',
        totalSize: 'Total Size',
        oldest: 'Oldest',
        newest: 'Newest',
        breakdown: 'Breakdown by Age',
        recommendations: 'Recommendations',

        scanFailed: 'Scan failed',
        errors: 'errors occurred',

        dryRunMode: 'Dry run mode - no files will be deleted',
        backupSaved: 'Backup saved to',
    },
    vi: {
        found: 'Tìm thấy',
        folders: 'thư mục node_modules',
        scanning: 'Đang quét',
        noFolders: 'Không tìm thấy thư mục node_modules nào.',
        cancelled: 'Đã hủy.',
        goodbye: 'Tạm biệt!',

        deleting: 'Đang xóa',
        deleted: 'Đã xóa',
        freed: 'Đã giải phóng',
        cleaning: 'Đang dọn dẹp',
        deepCleaning: 'Đang dọn sâu',
        processed: 'Đã xử lý',
        removed: 'Đã xóa',
        files: 'tập tin',

        scanPath: 'Nhập đường dẫn để quét:',
        ageFilter: 'Lọc theo tuổi (vd: 30d, 3m) hoặc Enter để bỏ qua:',
        confirmDelete: 'Xóa các thư mục này?',
        viewList: 'Xem danh sách thư mục?',
        selectAction: 'Chọn hành động:',

        report: 'Báo cáo Node Modules',
        totalFolders: 'Tổng số thư mục',
        totalSize: 'Tổng dung lượng',
        oldest: 'Cũ nhất',
        newest: 'Mới nhất',
        breakdown: 'Phân tích theo độ tuổi',
        recommendations: 'Đề xuất',

        scanFailed: 'Quét thất bại',
        errors: 'lỗi xảy ra',

        dryRunMode: 'Chế độ thử - không có tập tin nào bị xóa',
        backupSaved: 'Sao lưu được lưu tại',
    },
    zh: {
        found: '找到',
        folders: 'node_modules 文件夹',
        scanning: '正在扫描',
        noFolders: '未找到 node_modules 文件夹。',
        cancelled: '已取消。',
        goodbye: '再见！',

        deleting: '正在删除',
        deleted: '已删除',
        freed: '已释放',
        cleaning: '正在清理',
        deepCleaning: '正在深度清理',
        processed: '已处理',
        removed: '已移除',
        files: '文件',

        scanPath: '输入要扫描的路径：',
        ageFilter: '按年龄筛选（如：30d、3m）或按 Enter 跳过：',
        confirmDelete: '删除这些文件夹？',
        viewList: '查看文件夹列表？',
        selectAction: '选择操作：',

        report: 'Node Modules 报告',
        totalFolders: '文件夹总数',
        totalSize: '总大小',
        oldest: '最旧',
        newest: '最新',
        breakdown: '按年龄分类',
        recommendations: '建议',

        scanFailed: '扫描失败',
        errors: '发生错误',

        dryRunMode: '试运行模式 - 不会删除任何文件',
        backupSaved: '备份已保存到',
    },
    ja: {
        found: '見つかりました',
        folders: 'node_modules フォルダ',
        scanning: 'スキャン中',
        noFolders: 'node_modules フォルダが見つかりませんでした。',
        cancelled: 'キャンセルしました。',
        goodbye: 'さようなら！',

        deleting: '削除中',
        deleted: '削除しました',
        freed: '解放しました',
        cleaning: 'クリーニング中',
        deepCleaning: 'ディープクリーニング中',
        processed: '処理しました',
        removed: '削除しました',
        files: 'ファイル',

        scanPath: 'スキャンするパスを入力：',
        ageFilter: '年齢でフィルター（例：30d、3m）またはEnterでスキップ：',
        confirmDelete: 'これらのフォルダを削除しますか？',
        viewList: 'フォルダリストを表示しますか？',
        selectAction: 'アクションを選択：',

        report: 'Node Modules レポート',
        totalFolders: 'フォルダ総数',
        totalSize: '合計サイズ',
        oldest: '最も古い',
        newest: '最も新しい',
        breakdown: '年齢別内訳',
        recommendations: '推奨事項',

        scanFailed: 'スキャン失敗',
        errors: 'エラーが発生',

        dryRunMode: 'ドライランモード - ファイルは削除されません',
        backupSaved: 'バックアップを保存しました',
    },
    ko: {
        found: '발견',
        folders: 'node_modules 폴더',
        scanning: '스캔 중',
        noFolders: 'node_modules 폴더를 찾을 수 없습니다.',
        cancelled: '취소되었습니다.',
        goodbye: '안녕히 가세요!',

        deleting: '삭제 중',
        deleted: '삭제됨',
        freed: '확보됨',
        cleaning: '정리 중',
        deepCleaning: '심층 정리 중',
        processed: '처리됨',
        removed: '제거됨',
        files: '파일',

        scanPath: '스캔할 경로를 입력하세요:',
        ageFilter: '연령으로 필터링 (예: 30d, 3m) 또는 Enter로 건너뛰기:',
        confirmDelete: '이 폴더들을 삭제하시겠습니까?',
        viewList: '폴더 목록을 보시겠습니까?',
        selectAction: '작업을 선택하세요:',

        report: 'Node Modules 보고서',
        totalFolders: '총 폴더 수',
        totalSize: '총 크기',
        oldest: '가장 오래된',
        newest: '가장 최근',
        breakdown: '연령별 분류',
        recommendations: '권장 사항',

        scanFailed: '스캔 실패',
        errors: '오류 발생',

        dryRunMode: '드라이런 모드 - 파일이 삭제되지 않습니다',
        backupSaved: '백업이 저장되었습니다',
    },
    es: {
        found: 'Encontrado',
        folders: 'carpetas node_modules',
        scanning: 'Escaneando',
        noFolders: 'No se encontraron carpetas node_modules.',
        cancelled: 'Cancelado.',
        goodbye: '¡Adiós!',

        deleting: 'Eliminando',
        deleted: 'Eliminado',
        freed: 'Liberado',
        cleaning: 'Limpiando',
        deepCleaning: 'Limpieza profunda',
        processed: 'Procesado',
        removed: 'Eliminado',
        files: 'archivos',

        scanPath: 'Ingrese la ruta a escanear:',
        ageFilter: 'Filtrar por edad (ej: 30d, 3m) o Enter para omitir:',
        confirmDelete: '¿Eliminar estas carpetas?',
        viewList: '¿Ver lista de carpetas?',
        selectAction: 'Seleccionar acción:',

        report: 'Informe de Node Modules',
        totalFolders: 'Total de carpetas',
        totalSize: 'Tamaño total',
        oldest: 'Más antiguo',
        newest: 'Más reciente',
        breakdown: 'Desglose por edad',
        recommendations: 'Recomendaciones',

        scanFailed: 'Escaneo fallido',
        errors: 'errores ocurridos',

        dryRunMode: 'Modo simulado - no se eliminarán archivos',
        backupSaved: 'Copia de seguridad guardada en',
    },
    fr: {
        found: 'Trouvé',
        folders: 'dossiers node_modules',
        scanning: 'Analyse en cours',
        noFolders: 'Aucun dossier node_modules trouvé.',
        cancelled: 'Annulé.',
        goodbye: 'Au revoir !',

        deleting: 'Suppression',
        deleted: 'Supprimé',
        freed: 'Libéré',
        cleaning: 'Nettoyage',
        deepCleaning: 'Nettoyage approfondi',
        processed: 'Traité',
        removed: 'Supprimé',
        files: 'fichiers',

        scanPath: 'Entrez le chemin à analyser :',
        ageFilter: 'Filtrer par âge (ex : 30d, 3m) ou Entrée pour ignorer :',
        confirmDelete: 'Supprimer ces dossiers ?',
        viewList: 'Voir la liste des dossiers ?',
        selectAction: 'Sélectionner une action :',

        report: 'Rapport Node Modules',
        totalFolders: 'Total des dossiers',
        totalSize: 'Taille totale',
        oldest: 'Plus ancien',
        newest: 'Plus récent',
        breakdown: 'Répartition par âge',
        recommendations: 'Recommandations',

        scanFailed: 'Analyse échouée',
        errors: 'erreurs survenues',

        dryRunMode: 'Mode simulation - aucun fichier ne sera supprimé',
        backupSaved: 'Sauvegarde enregistrée dans',
    },
    de: {
        found: 'Gefunden',
        folders: 'node_modules Ordner',
        scanning: 'Scannen',
        noFolders: 'Keine node_modules Ordner gefunden.',
        cancelled: 'Abgebrochen.',
        goodbye: 'Auf Wiedersehen!',

        deleting: 'Löschen',
        deleted: 'Gelöscht',
        freed: 'Freigegeben',
        cleaning: 'Bereinigung',
        deepCleaning: 'Tiefenreinigung',
        processed: 'Verarbeitet',
        removed: 'Entfernt',
        files: 'Dateien',

        scanPath: 'Pfad zum Scannen eingeben:',
        ageFilter: 'Nach Alter filtern (z.B. 30d, 3m) oder Enter zum Überspringen:',
        confirmDelete: 'Diese Ordner löschen?',
        viewList: 'Ordnerliste anzeigen?',
        selectAction: 'Aktion auswählen:',

        report: 'Node Modules Bericht',
        totalFolders: 'Ordner insgesamt',
        totalSize: 'Gesamtgröße',
        oldest: 'Älteste',
        newest: 'Neueste',
        breakdown: 'Aufschlüsselung nach Alter',
        recommendations: 'Empfehlungen',

        scanFailed: 'Scan fehlgeschlagen',
        errors: 'Fehler aufgetreten',

        dryRunMode: 'Testlauf - keine Dateien werden gelöscht',
        backupSaved: 'Backup gespeichert unter',
    },
};

let currentLanguage: Language = 'en';

/**
 * Set the current language
 */
export function setLanguage(lang: string): void {
    if (lang in translations) {
        currentLanguage = lang as Language;
    } else {
        // Try to match by prefix (e.g., 'en-US' -> 'en')
        const prefix = lang.split('-')[0].toLowerCase();
        if (prefix in translations) {
            currentLanguage = prefix as Language;
        }
    }
}

/**
 * Get a translated string
 */
export function t(key: keyof Translations): string {
    return translations[currentLanguage][key] || translations.en[key] || key;
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): Language[] {
    return Object.keys(translations) as Language[];
}

/**
 * Get current language
 */
export function getCurrentLanguage(): Language {
    return currentLanguage;
}

export default {
    setLanguage,
    t,
    getAvailableLanguages,
    getCurrentLanguage,
};
