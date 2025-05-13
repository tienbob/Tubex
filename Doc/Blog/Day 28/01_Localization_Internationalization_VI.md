```markdown
<!-- filepath: d:\All python project\Tubex\Doc\Blog\Day 28\01_Localization_Internationalization_VI.md -->
# Triển khai bản địa hóa và quốc tế hóa với sự hỗ trợ của AI

## Giới thiệu

Sau khi tăng cường tính bảo mật cho ứng dụng, chúng tôi đã chuyển trọng tâm sang việc làm cho nền tảng SaaS B2B Tubex trở nên dễ tiếp cận với người dùng ở các khu vực và ngôn ngữ khác nhau. Vào ngày 27-28 của hành trình phát triển, chúng tôi đã giải quyết thách thức triển khai các tính năng bản địa hóa và quốc tế hóa (i18n) toàn diện. Bài viết này mô tả chi tiết cách chúng tôi tận dụng sự hỗ trợ của AI để xây dựng trải nghiệm đa ngôn ngữ hỗ trợ chiến lược mở rộng của chúng tôi vào các khu vực khác nhau của Việt Nam và hơn thế nữa.

## Thách thức bản địa hóa

Việc triển khai bản địa hóa và quốc tế hóa phù hợp cho Tubex đặt ra một số thách thức phức tạp:

- Hỗ trợ nhiều ngôn ngữ (ban đầu là tiếng Việt và tiếng Anh, với kế hoạch mở rộng thêm)
- Xử lý các định dạng ngày giờ khác nhau giữa các khu vực
- Quản lý sự khác biệt về định dạng số và tiền tệ
- Tạo hệ thống quản lý bản dịch linh hoạt
- Đảm bảo trải nghiệm người dùng nhất quán trên tất cả các ngôn ngữ
- Xây dựng hệ thống có thể mở rộng cho nhiều ngôn ngữ trong tương lai

## Chiến lược đặt lệnh hiệu quả

### Những gì đã hoạt động tốt

1. **Bắt đầu với kiến trúc**
   ```
   Chúng tôi cần triển khai i18n cho nền tảng SaaS B2B Tubex. Chúng tôi đang sử dụng React với TypeScript cho frontend và Node.js cho backend. Phương pháp tiếp cận kiến trúc tốt nhất cho một hệ thống i18n có thể mở rộng ban đầu sẽ hỗ trợ tiếng Việt và tiếng Anh, nhưng có thể mở rộng sang nhiều ngôn ngữ sau này là gì?
   ```
   
   Bằng cách bắt đầu với các câu hỏi kiến trúc cấp cao, AI đã cung cấp hướng dẫn về cách cấu trúc triển khai i18n của chúng tôi với tầm nhìn mở rộng trong tương lai thay vì chỉ giải quyết nhu cầu dịch thuật ngay lập tức.

2. **Thách thức triển khai cụ thể**
   ```
   Chúng tôi đang sử dụng react-i18next cho bản địa hóa. Làm thế nào để xử lý quy tắc số nhiều cho số đếm tiếng Việt? Ví dụ, trong tiếng Anh chúng ta có "1 product" và "2 products", nhưng tiếng Việt xử lý số nhiều khác biệt.
   ```
   
   Bằng cách hỏi về các thách thức ngôn ngữ cụ thể, chúng tôi đã nhận được các giải pháp được điều chỉnh tôn trọng sự tinh tế của từng ngôn ngữ thay vì áp dụng các quy tắc ngữ pháp tiếng Anh một cách phổ quát.

3. **Yêu cầu chuyển đổi mã**
   ```
   Đây là thành phần danh sách sản phẩm hiện tại của chúng tôi:
   
   [khối mã]
   
   Chúng tôi nên sửa đổi thành phần này như thế nào để hỗ trợ i18n với react-i18next trong khi vẫn duy trì chức năng hiện có?
   ```
   
   Cung cấp mã hiện có và yêu cầu sửa đổi dành riêng cho i18n đã giúp AI hiểu codebase của chúng tôi và đưa ra những thay đổi chính xác tích hợp tốt với ứng dụng của chúng tôi.

4. **Câu hỏi về quy trình làm việc dịch thuật**
   ```
   Phương pháp tốt nhất để quản lý bản dịch cho một ứng dụng B2B đang phát triển là gì? Chúng tôi cần một quy trình cho phép người dịch không phải là kỹ thuật viên đóng góp trong khi vẫn duy trì quyền kiểm soát của nhà phát triển đối với logic ứng dụng.
   ```
   
   Loại lệnh này đã giúp chúng tôi thiết lập quy trình làm việc hiệu quả để quản lý bản dịch như một nhóm, xem xét cả những người đóng góp có kỹ thuật và không có kỹ thuật.

## Phương pháp triển khai

### 1. Thiết lập kiến trúc i18n

Với sự hướng dẫn của AI, chúng tôi đã triển khai một kiến trúc i18n toàn diện:

```typescript
// i18n.ts - Cấu hình i18n cốt lõi của chúng tôi
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import moment from 'moment';
import 'moment/locale/vi';

// Khởi tạo i18next
i18n
  // Tải bản dịch từ server
  .use(Backend)
  // Phát hiện ngôn ngữ của người dùng
  .use(LanguageDetector)
  // Chuyển instance i18n cho react-i18next
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'vi'],
    
    // Không gian tên mặc định
    defaultNS: 'common',
    
    // Không gian tên cho các phần khác nhau của ứng dụng
    ns: ['common', 'auth', 'inventory', 'orders', 'products', 'reports'],
    
    // Cho phép khóa là các cụm từ có `:`, `.`
    keySeparator: false,
    nsSeparator: ':',
    
    // Không tải ngôn ngữ dự phòng
    load: 'currentOnly',
    
    interpolation: {
      escapeValue: false, // React đã thoát các giá trị
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
        
        // Định dạng ngày dựa trên ngôn ngữ
        if (value instanceof Date) {
          const locale = lng || 'en';
          moment.locale(locale);
          
          switch (format) {
            case 'fromNow':
              return moment(value).fromNow();
            case 'shortDate':
              return moment(value).format('L');
            case 'longDate':
              return moment(value).format('LL');
            case 'fullDate':
              return moment(value).format('LLLL');
            default:
              return moment(value).format(format);
          }
        }
        
        // Định dạng tiền tệ dựa trên ngôn ngữ
        if (format === 'vnd' && typeof value === 'number') {
          return new Intl.NumberFormat(lng === 'vi' ? 'vi-VN' : 'en-US', { 
            style: 'currency', 
            currency: 'VND',
            // Không có chữ số thập phân cho VND
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value);
        }
        
        // Định dạng số
        if (format === 'number' && typeof value === 'number') {
          return new Intl.NumberFormat(lng === 'vi' ? 'vi-VN' : 'en-US').format(value);
        }
        
        return value;
      }
    },
    
    // Tùy chọn React
    react: {
      useSuspense: true,
    },
    
    // Cấu hình backend
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Tùy chọn phát hiện
    detection: {
      // Thứ tự phát hiện ngôn ngữ
      order: ['localStorage', 'cookie', 'navigator'],
      // Lưu trữ lựa chọn ngôn ngữ trong cookie và localStorage
      caches: ['localStorage', 'cookie'],
      // Tùy chọn cookie
      cookieMinutes: 60 * 24 * 30, // 30 ngày
    }
  });

export default i18n;
```

### 2. Context Provider cho bản dịch

Trợ lý AI đã giúp chúng tôi triển khai một context provider cho bản địa hóa:

```tsx
// TranslationProvider.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';

type Language = 'en' | 'vi';

interface TranslationContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  formatDate: (date: Date, format?: string) => string;
  formatCurrency: (amount: number) => string;
  formatNumber: (num: number) => string;
  formatRelativeTime: (date: Date) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>((i18n.language as Language) || 'en');
  
  useEffect(() => {
    // Đồng bộ hóa ngôn ngữ với instance i18n
    if (i18n.language !== language) {
      setLanguage(i18n.language as Language);
    }
  }, [i18n.language, language]);
  
  const changeLanguage = async (lang: Language) => {
    try {
      await i18n.changeLanguage(lang);
      setLanguage(lang);
      moment.locale(lang === 'en' ? 'en' : 'vi');
      
      // Cập nhật thuộc tính lang của HTML
      document.documentElement.setAttribute('lang', lang);
      
      // Cập nhật thuộc tính dir của HTML để hỗ trợ RTL trong tương lai
      document.documentElement.setAttribute('dir', 'ltr');
    } catch (error) {
      console.error('Không thể thay đổi ngôn ngữ:', error);
    }
  };
  
  const formatDate = (date: Date, format: string = 'shortDate'): string => {
    moment.locale(language === 'en' ? 'en' : 'vi');
    
    switch (format) {
      case 'shortDate':
        return moment(date).format('L');
      case 'longDate':
        return moment(date).format('LL');
      case 'fullDate':
        return moment(date).format('LLLL');
      default:
        return moment(date).format(format);
    }
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', { 
      style: 'currency', 
      currency: language === 'en' ? 'USD' : 'VND',
      minimumFractionDigits: language === 'en' ? 2 : 0,
      maximumFractionDigits: language === 'en' ? 2 : 0
    }).format(amount);
  };
  
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN').format(num);
  };
  
  const formatRelativeTime = (date: Date): string => {
    moment.locale(language === 'en' ? 'en' : 'vi');
    return moment(date).fromNow();
  };
  
  const value = {
    language,
    changeLanguage,
    formatDate,
    formatCurrency,
    formatNumber,
    formatRelativeTime
  };
  
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext phải được sử dụng trong TranslationProvider');
  }
  return context;
};
```

### 3. Triển khai bản dịch trong các thành phần

AI đã giúp chúng tôi cải tạo các thành phần của mình để hỗ trợ bản dịch:

```tsx
// ProductCard.tsx - Trước khi triển khai i18n
import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    lastUpdated: Date;
  };
  onAddToOrder: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToOrder }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{product.name}</Typography>
        <Typography variant="body1">Price: ${product.price}</Typography>
        <Typography variant="body2">
          In Stock: {product.stock} units
        </Typography>
        <Typography variant="caption">
          Last Updated: {product.lastUpdated.toLocaleDateString()}
        </Typography>
        <Box mt={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => onAddToOrder(product.id)}
            disabled={product.stock === 0}
          >
            {product.stock > 0 ? 'Add to Order' : 'Out of Stock'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
```

Đây là thành phần sau khi triển khai i18n với sự giúp đỡ của AI:

```tsx
// ProductCard.tsx - Sau khi triển khai i18n
import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTranslationContext } from '../contexts/TranslationProvider';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    lastUpdated: Date;
  };
  onAddToOrder: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToOrder }) => {
  const { t } = useTranslation('products');
  const { formatCurrency, formatDate, formatNumber } = useTranslationContext();
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{product.name}</Typography>
        <Typography variant="body1">
          {t('product.price')}: {formatCurrency(product.price)}
        </Typography>
        <Typography variant="body2">
          {t('product.stock', { count: product.stock })}: {formatNumber(product.stock)} {t('product.units')}
        </Typography>
        <Typography variant="caption">
          {t('product.lastUpdated')}: {formatDate(product.lastUpdated, 'shortDate')}
        </Typography>
        <Box mt={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => onAddToOrder(product.id)}
            disabled={product.stock === 0}
          >
            {product.stock > 0 ? t('product.addToOrder') : t('product.outOfStock')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
```

### 4. Hệ thống quản lý bản dịch

Với sự hướng dẫn của AI, chúng tôi đã triển khai một dịch vụ backend để quản lý bản dịch:

```typescript
// translation.service.ts
import fs from 'fs/promises';
import path from 'path';
import { getRepository } from 'typeorm';
import { Translation } from '../database/models/Translation';

export class TranslationService {
  private localesDir: string;
  
  constructor() {
    this.localesDir = path.join(__dirname, '../../public/locales');
  }
  
  /**
   * Lấy tất cả bản dịch cho một không gian tên và ngôn ngữ
   */
  async getTranslations(language: string, namespace: string) {
    try {
      const repository = getRepository(Translation);
      
      const translations = await repository.find({
        where: { language, namespace },
      });
      
      // Chuyển đổi thành đối tượng key-value
      const translationObj: Record<string, string> = {};
      translations.forEach(t => {
        translationObj[t.key] = t.value;
      });
      
      return translationObj;
    } catch (error) {
      console.error(`Lỗi khi lấy bản dịch cho ${language}:${namespace}`, error);
      throw new Error('Không thể lấy bản dịch');
    }
  }
  
  /**
   * Cập nhật file bản dịch từ cơ sở dữ liệu
   */
  async syncTranslationsToFiles() {
    try {
      const repository = getRepository(Translation);
      const languages = ['en', 'vi'];
      const namespaces = ['common', 'auth', 'inventory', 'orders', 'products', 'reports'];
      
      // Đảm bảo thư mục locales tồn tại
      await fs.mkdir(this.localesDir, { recursive: true });
      
      // Xử lý từng ngôn ngữ và không gian tên
      for (const language of languages) {
        const languageDir = path.join(this.localesDir, language);
        await fs.mkdir(languageDir, { recursive: true });
        
        for (const namespace of namespaces) {
          // Lấy bản dịch từ cơ sở dữ liệu
          const translations = await repository.find({
            where: { language, namespace },
          });
          
          // Chuyển đổi thành đối tượng JSON
          const translationObj: Record<string, string> = {};
          translations.forEach(t => {
            translationObj[t.key] = t.value;
          });
          
          // Ghi vào file JSON
          const filePath = path.join(languageDir, `${namespace}.json`);
          await fs.writeFile(filePath, JSON.stringify(translationObj, null, 2), 'utf8');
        }
      }
      
      return { success: true, message: 'Đồng bộ bản dịch vào file thành công' };
    } catch (error) {
      console.error('Lỗi đồng bộ bản dịch vào file:', error);
      throw new Error('Không thể đồng bộ bản dịch vào file');
    }
  }
  
  /**
   * Cập nhật hoặc tạo một bản dịch
   */
  async upsertTranslation(language: string, namespace: string, key: string, value: string) {
    try {
      const repository = getRepository(Translation);
      
      let translation = await repository.findOne({
        where: { language, namespace, key }
      });
      
      if (translation) {
        // Cập nhật bản dịch hiện có
        translation.value = value;
        translation.updatedAt = new Date();
      } else {
        // Tạo bản dịch mới
        translation = repository.create({
          language,
          namespace,
          key,
          value,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      await repository.save(translation);
      
      // Đồng bộ file sau khi cập nhật
      await this.syncTranslationsToFiles();
      
      return translation;
    } catch (error) {
      console.error('Lỗi cập nhật bản dịch:', error);
      throw new Error('Không thể cập nhật bản dịch');
    }
  }
  
  /**
   * Nhập bản dịch từ JSON
   */
  async importTranslations(language: string, namespace: string, translations: Record<string, string>) {
    try {
      const repository = getRepository(Translation);
      const translationEntities = [];
      
      for (const [key, value] of Object.entries(translations)) {
        let translation = await repository.findOne({
          where: { language, namespace, key }
        });
        
        if (translation) {
          // Cập nhật bản dịch hiện có
          translation.value = value;
          translation.updatedAt = new Date();
        } else {
          // Tạo bản dịch mới
          translation = repository.create({
            language,
            namespace,
            key,
            value,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        translationEntities.push(translation);
      }
      
      await repository.save(translationEntities);
      
      // Đồng bộ file sau khi nhập
      await this.syncTranslationsToFiles();
      
      return { success: true, count: translationEntities.length };
    } catch (error) {
      console.error('Lỗi nhập bản dịch:', error);
      throw new Error('Không thể nhập bản dịch');
    }
  }
}
```

### 5. Thành phần chuyển đổi ngôn ngữ

AI đã giúp chúng tôi tạo một bộ chuyển đổi ngôn ngữ thân thiện với người dùng:

```tsx
// LanguageSwitcher.tsx
import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import { useTranslationContext } from '../contexts/TranslationProvider';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  variant?: 'minimal' | 'standard';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'standard' }) => {
  const { language, changeLanguage } = useTranslationContext();
  const { t } = useTranslation('common');
  
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newLanguage: string | null) => {
    if (newLanguage) {
      changeLanguage(newLanguage as 'en' | 'vi');
    }
  };
  
  if (variant === 'minimal') {
    return (
      <ToggleButtonGroup
        value={language}
        exclusive
        onChange={handleChange}
        size="small"
        aria-label={t('languageSwitcher.ariaLabel')}
      >
        <ToggleButton value="en" aria-label={t('languageSwitcher.english')}>
          EN
        </ToggleButton>
        <ToggleButton value="vi" aria-label={t('languageSwitcher.vietnamese')}>
          VI
        </ToggleButton>
      </ToggleButtonGroup>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2">
        {t('languageSwitcher.selectLanguage')}:
      </Typography>
      <ToggleButtonGroup
        value={language}
        exclusive
        onChange={handleChange}
        aria-label={t('languageSwitcher.ariaLabel')}
      >
        <ToggleButton value="en" aria-label={t('languageSwitcher.english')}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img 
              src="/images/flags/en.svg" 
              alt="Cờ Anh" 
              width={20}
              height={15}
            />
            <span>English</span>
          </Box>
        </ToggleButton>
        <ToggleButton value="vi" aria-label={t('languageSwitcher.vietnamese')}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img 
              src="/images/flags/vi.svg" 
              alt="Cờ Việt Nam" 
              width={20}
              height={15}
            />
            <span>Tiếng Việt</span>
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default LanguageSwitcher;
```

## Thách thức và bài học kinh nghiệm

### Thách thức

1. **Quy tắc số nhiều trong tiếng Việt**
   
   Tiếng Việt không có dạng số nhiều rõ ràng như tiếng Anh. AI đã giúp chúng tôi triển khai giải pháp tôn trọng những khác biệt ngôn ngữ này.

2. **Định dạng ngày giờ**
   
   Định dạng ngày tháng trong tiếng Việt khác với tiếng Anh. Chúng tôi đã triển khai định dạng ngày tháng theo ngôn ngữ với sự giúp đỡ của AI.

3. **Quản lý bản dịch**
   
   Quản lý bản dịch trên toàn bộ ứng dụng đang phát triển trở nên phức tạp. AI đã giúp chúng tôi triển khai hệ thống bản dịch dựa trên cơ sở dữ liệu với khả năng xuất file.

### Những điều có thể cải thiện

1. **Thiếu cấu trúc ban đầu**
   
   Ban đầu chúng tôi đặt bản dịch trong một file duy nhất, điều này trở nên cồng kềnh. AI đã giúp chúng tôi cơ cấu lại:

   ```
   TRƯỚC: Một file translations.json khổng lồ với tất cả các khóa
   
   SAU: Tổ chức theo không gian tên:
   - common.json (bản dịch chung)
   - auth.json (liên quan đến xác thực)
   - inventory.json (quản lý kho hàng)
   - orders.json (xử lý đơn hàng)
   - v.v.
   ```

2. **Khóa bản dịch không nhất quán**
   
   Cách tiếp cận đầu tiên của chúng tôi sử dụng các khóa không nhất quán. AI đã đề xuất quy ước tốt hơn:

   ```
   TRƯỚC: 
   - "welcomeMessage": "Chào mừng đến Tubex"
   - "orderButtonText": "Đặt hàng"
   
   SAU: Tổ chức dựa trên phần:
   - "dashboard.welcomeMessage": "Chào mừng đến Tubex"
   - "order.submitButton": "Đặt hàng"
   ```

## Kết quả và tác động

Việc triển khai bản địa hóa của chúng tôi đã mang lại những cải tiến đáng kể:

- **Hỗ trợ đầy đủ cho tiếng Việt và tiếng Anh** trên toàn bộ ứng dụng
- **Định dạng nhất quán** cho ngày tháng, số và tiền tệ dựa trên ngôn ngữ
- **Hệ thống quản lý bản dịch linh hoạt** cho phép những người không phải nhà phát triển đóng góp bản dịch
- **Giảm chi phí bảo trì bản dịch** thông qua các không gian tên có tổ chức
- **Cải thiện trải nghiệm người dùng** cho người dùng Việt Nam với định dạng phù hợp về mặt văn hóa
- **Kiến trúc có thể mở rộng** dễ dàng hỗ trợ thêm ngôn ngữ

## Công việc trong tương lai

Trong thời gian tới, chúng tôi dự định:

1. Triển khai thêm ngôn ngữ, đặc biệt là cho các thị trường khu vực
2. Thêm giao diện người dùng quản lý bản dịch trên web cho người dùng không phải kỹ thuật viên
3. Triển khai quy tắc số nhiều nâng cao cho các câu phức tạp hơn
4. Hỗ trợ ngôn ngữ viết từ phải sang trái trong thư viện thành phần của chúng tôi

## Kết luận

Việc triển khai bản địa hóa và quốc tế hóa cho nền tảng SaaS B2B Tubex là một bước đi thách thức nhưng thiết yếu trong chiến lược phát triển toàn cầu của chúng tôi. Sự hướng dẫn của AI đã chứng tỏ giá trị vô cùng lớn trong việc giúp chúng tôi thiết kế một giải pháp có thể mở rộng tôn trọng sự khác biệt về ngôn ngữ và văn hóa trong khi vẫn duy trì trải nghiệm người dùng nhất quán.

Chìa khóa để thành công là tiếp cận bản địa hóa như một vấn đề kiến trúc cơ bản thay vì một tính năng bề ngoài. Bằng cách triển khai các mẫu i18n phù hợp ngay từ đầu và xem xét nhu cầu cụ thể của các ngôn ngữ mục tiêu, chúng tôi đã xây dựng một nền tảng thực sự có thể phục vụ người dùng ở các khu vực và văn hóa khác nhau.
```
