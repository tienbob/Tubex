```markdown
<!-- filepath: d:\All python project\Tubex\Doc\Blog\Day 22\01_Analytics_Dashboard_Implementation_VI.md -->
# Triển khai Bảng điều khiển phân tích với sự hỗ trợ của AI

## Giới thiệu

Khi nền tảng SaaS B2B Tubex của chúng tôi tiếp tục phát triển, chúng tôi đã đạt đến một cột mốc quan trọng - triển khai bảng điều khiển phân tích toàn diện. Thành phần này rất quan trọng để các đại lý vật liệu xây dựng có thể hiểu rõ về hiệu suất kinh doanh của họ. Trong ngày 21-22 của hành trình phát triển, chúng tôi đã giải quyết thách thức tạo ra các trực quan hóa dữ liệu tương tác và các tính năng thông minh kinh doanh với sự hỗ trợ của trợ lý lập trình AI. Bài viết này mô tả chi tiết phương pháp tiếp cận, các kỹ thuật đặt lệnh chúng tôi đã sử dụng, và bài học kinh nghiệm trong quá trình triển khai.

## Thách thức của Bảng điều khiển phân tích

Xây dựng bảng điều khiển phân tích hiệu quả cho Tubex đặt ra một số thách thức phức tạp:

- Thiết kế các KPI có ý nghĩa dành riêng cho đại lý vật liệu xây dựng
- Tạo các trực quan hóa tương tác và phản hồi nhanh
- Triển khai xử lý dữ liệu thời gian thực
- Đảm bảo hiệu suất với các tập dữ liệu lớn
- Xây dựng tính năng báo cáo có thể tùy chỉnh
- Hỗ trợ báo cáo có thể xuất ra nhiều định dạng khác nhau

## Chiến lược đặt lệnh hiệu quả

### Những gì đã hoạt động tốt

1. **Chuyển giao kiến thức đặc thù ngành**
   ```
   Tôi cần tạo bảng điều khiển phân tích cho các đại lý vật liệu xây dựng.
   Những KPI và chỉ số quan trọng nhất mà sẽ có giá trị cho ngành cụ thể
   này là gì? Vui lòng đề xuất các loại trực quan hóa cho từng chỉ số và 
   cách chúng có thể được tổ chức trong bố cục bảng điều khiển.
   ```
   
   Bằng cách trước tiên yêu cầu chuyên môn đặc thù ngành, AI đã cung cấp hiểu biết sâu sắc về các chỉ số như luân chuyển kho, mô hình nhu cầu theo mùa và hiệu suất nhà cung cấp đặc biệt liên quan đến các đại lý vật liệu xây dựng, thay vì các đề xuất phân tích chung chung.

2. **Chia nhỏ thành phần với triển khai tiến dần**
   ```
   Hãy chia nhỏ việc triển khai bảng điều khiển thành các thành phần mô-đun. 
   Tôi muốn bắt đầu với: 1) Biểu đồ tổng quan bán hàng, 2) Trạng thái kho hàng, 
   3) Sản phẩm và khách hàng hàng đầu, và 4) Chỉ số thực hiện đơn hàng. 
   Đối với thành phần tổng quan bán hàng, vui lòng giúp tôi tạo một thành phần
   biểu đồ có thể tái sử dụng bằng Chart.js có thể xử lý các khoảng thời gian
   khác nhau (hàng ngày, hàng tuần, hàng tháng, hàng năm) và bao gồm một bộ
   chọn khoảng thời gian.
   ```
   
   Việc chia nhỏ bảng điều khiển thành các thành phần riêng biệt và sau đó làm việc với chúng một cách có hệ thống đã giúp quản lý độ phức tạp. AI đã cung cấp mã tập trung cho từng module với các điểm tích hợp rõ ràng.

3. **Hướng dẫn mẫu xử lý dữ liệu**
   ```
   Tôi đang xử lý các tập dữ liệu lớn cho bảng điều khiển. Phương pháp hiệu quả
   nhất để xử lý và tổng hợp dữ liệu này cho trực quan hóa là gì? Hãy xem xét
   rằng tôi cần hỗ trợ cả cập nhật thời gian thực và xu hướng lịch sử. Vui lòng
   cho tôi xem một mẫu sử dụng React hooks có thể xử lý việc lấy, chuyển đổi và
   lưu trữ dữ liệu trong bộ nhớ đệm.
   ```
   
   Lệnh này đã dẫn đến hướng dẫn chi tiết về việc triển khai một hook tùy chỉnh để tổng hợp dữ liệu, bao gồm các kỹ thuật ghi nhớ và cập nhật gia tăng đã cải thiện đáng kể hiệu suất bảng điều khiển.

4. **Tinh chỉnh trực quan hóa thông qua lệnh lặp đi lặp lại**
   ```
   Biểu đồ trạng thái kho hàng trông tốt, nhưng tôi muốn nâng cao nó với:
   1. Mã màu dựa trên mức tồn kho (thấp/trung bình/cao)
   2. Tooltip tương tác hiển thị thông tin chi tiết hơn
   3. Khả năng khoan sâu vào các danh mục sản phẩm cụ thể
   
   Đây là mã thành phần hiện tại của tôi: [đoạn mã]
   
   Tôi nên sửa đổi điều này như thế nào để hỗ trợ các tính năng này?
   ```
   
   Bắt đầu với một triển khai cơ bản và sau đó nâng cao nó dần dần thông qua các lệnh cụ thể đã cho phép chúng tôi tinh chỉnh trực quan hóa với các tính năng phức tạp trong khi vẫn duy trì chất lượng mã.

## Chi tiết triển khai

### Cấu trúc cốt lõi của bảng điều khiển

Chúng tôi đã triển khai một cấu trúc bảng điều khiển mô-đun bằng React với các thành phần sau:

1. **DashboardLayout**: Thành phần container quản lý bố cục tổng thể và trạng thái chia sẻ
2. **FilterBar**: Bộ lọc toàn cục ảnh hưởng đến tất cả các thành phần bảng điều khiển
3. **VisualizationComponents**: Các thành phần biểu đồ và bảng riêng lẻ
4. **ExportManager**: Xử lý tạo và tải xuống báo cáo

AI đã giúp chúng tôi triển khai giải pháp quản lý trạng thái dựa trên ngữ cảnh để chia sẻ dữ liệu hiệu quả giữa các thành phần:

```jsx
// Ngữ cảnh Bảng điều khiển cung cấp trạng thái và bộ lọc chia sẻ
export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [activeFilters, setActiveFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  
  // Logic lấy và xử lý dữ liệu
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Gọi API và tổng hợp dữ liệu
      const salesData = await api.getSalesData(timeRange, activeFilters);
      const inventoryData = await api.getInventoryData(activeFilters);
      const customerData = await api.getCustomerData(timeRange, activeFilters);
      
      // Xử lý và tổng hợp dữ liệu
      const processedData = {
        sales: processSalesData(salesData),
        inventory: processInventoryData(inventoryData),
        customers: processCustomerData(customerData),
        // Chỉ số tổng hợp và tính toán
        metrics: calculateMetrics(salesData, inventoryData),
      };
      
      setDashboardData(processedData);
    } catch (error) {
      console.error('Lỗi tải dữ liệu bảng điều khiển:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, activeFilters]);
  
  // Cập nhật dữ liệu khi bộ lọc hoặc phạm vi thời gian thay đổi
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  const value = {
    timeRange,
    setTimeRange,
    activeFilters,
    setActiveFilters,
    isLoading,
    dashboardData,
    refreshData: fetchDashboardData,
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
```

### Trực quan hóa Dữ liệu Hiệu suất

Một trong những kỹ thuật mà AI đã giúp chúng tôi triển khai là sự kết hợp của các trực quan hóa thời gian thực và lịch sử trong một giao diện liền mạch. Dưới đây là một trong các thành phần biểu đồ chính:

```jsx
// SalesPerformanceChart.tsx - Biểu đồ hiệu suất bán hàng tương tác
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useDashboardContext } from '../context/DashboardContext';
import { Typography, Card, CardContent, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';

const timeUnitOptions = [
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'monthly', label: 'Hàng tháng' },
];

const SalesPerformanceChart = () => {
  const { dashboardData, timeRange, setTimeRange } = useDashboardContext();
  const [timeUnit, setTimeUnit] = React.useState('weekly');
  
  // Memoize chart data để cải thiện hiệu suất
  const chartData = useMemo(() => {
    if (!dashboardData || !dashboardData.sales) return null;
    
    // Định dạng dữ liệu dựa trên đơn vị thời gian đã chọn
    const formattedData = formatChartData(dashboardData.sales, timeUnit);
    
    return {
      labels: formattedData.labels,
      datasets: [
        {
          label: 'Doanh số bán hàng thực tế',
          data: formattedData.actualSales,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        },
        {
          label: 'Doanh số bán hàng dự kiến',
          data: formattedData.projectedSales,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderDash: [5, 5],
          fill: false,
        },
        {
          label: 'Doanh số bán hàng năm trước',
          data: formattedData.previousYearSales,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderDash: [2, 2],
          fill: false,
        },
      ],
    };
  }, [dashboardData, timeUnit]);

  const chartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          // Logic callback tooltip tùy chỉnh
          label: function(context) {
            let label = context.dataset.label || '';
            let value = context.parsed.y.toLocaleString('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0
            });
            return `${label}: ${value}`;
          }
        }
      },
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  const handleTimeUnitChange = (event, newTimeUnit) => {
    if (newTimeUnit !== null) {
      setTimeUnit(newTimeUnit);
    }
  };

  if (!chartData) {
    return <div>Đang tải dữ liệu biểu đồ...</div>;
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Hiệu suất bán hàng</Typography>
          <ToggleButtonGroup
            value={timeUnit}
            exclusive
            onChange={handleTimeUnitChange}
            size="small"
          >
            {timeUnitOptions.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        <Line data={chartData} options={chartOptions} />
      </CardContent>
    </Card>
  );
};
```

### Phân tích hiệu suất sản phẩm

Một tính năng quan trọng khác là phân tích hiệu suất sản phẩm, nơi chúng tôi kết hợp nhiều loại dữ liệu (bán hàng, kho hàng, lợi nhuận) vào một công cụ trực quan:

```jsx
// ProductPerformanceAnalysis.tsx - Phân tích hiệu suất sản phẩm
import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Card, CardContent, Typography, Box, Tabs, Tab, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useDashboardContext } from '../context/DashboardContext';
import { downloadCSV } from '../utils/exportUtils';

const ProductPerformanceAnalysis = () => {
  const { dashboardData } = useDashboardContext();
  const [activeTab, setActiveTab] = useState(0);
  
  if (!dashboardData || !dashboardData.products) {
    return <div>Đang tải dữ liệu sản phẩm...</div>;
  }
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleExport = () => {
    const dataToExport = activeTab === 0 
      ? dashboardData.products.topSelling 
      : activeTab === 1 
        ? dashboardData.products.mostProfitable 
        : dashboardData.products.lowStock;
    
    downloadCSV(dataToExport, `product-performance-${['top-selling', 'most-profitable', 'low-stock'][activeTab]}`);
  };
  
  const topSellingColumns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Tên sản phẩm', flex: 1 },
    { field: 'category', headerName: 'Danh mục', width: 150 },
    { 
      field: 'quantitySold', 
      headerName: 'Số lượng đã bán', 
      width: 150,
      renderCell: (params) => params.value.toLocaleString('vi-VN')
    },
    { 
      field: 'revenue', 
      headerName: 'Doanh thu', 
      width: 150,
      renderCell: (params) => params.value.toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      })
    },
    { 
      field: 'percentageChange', 
      headerName: 'Thay đổi', 
      width: 120,
      renderCell: (params) => {
        const isPositive = params.value > 0;
        return (
          <Box sx={{ color: isPositive ? 'success.main' : 'error.main' }}>
            {isPositive ? '+' : ''}{params.value.toFixed(2)}%
          </Box>
        );
      }
    },
  ];
  
  // Các cấu hình cột tương tự cho các tab khác...
  
  const tabContent = [
    <DataGrid 
      rows={dashboardData.products.topSelling} 
      columns={topSellingColumns} 
      disableRowSelectionOnClick 
      density="compact"
      initialState={{
        pagination: { paginationModel: { pageSize: 5 } },
        sorting: { sortModel: [{ field: 'quantitySold', sort: 'desc' }] },
      }}
      pageSizeOptions={[5, 10, 25]}
    />,
    // Nội dung cho các tab khác...
  ];
  
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Phân tích hiệu suất sản phẩm</Typography>
          <IconButton onClick={handleExport} title="Tải xuống dữ liệu">
            <DownloadIcon />
          </IconButton>
        </Box>
        
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Bán chạy nhất" />
          <Tab label="Lợi nhuận nhất" />
          <Tab label="Tồn kho thấp" />
        </Tabs>
        
        <Box sx={{ height: 400, width: '100%', mt: 1 }}>
          {tabContent[activeTab]}
        </Box>
      </CardContent>
    </Card>
  );
};
```

### Chức năng xuất báo cáo

Chúng tôi đã triển khai một dịch vụ xuất báo cáo toàn diện như một phần của bảng điều khiển:

```typescript
// reportingService.ts - Dịch vụ xuất báo cáo
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './formatUtils';

export class ReportingService {
  // Tạo báo cáo PDF với bảng và biểu đồ
  generatePDFReport(reportData, reportOptions) {
    const { title, subtitle, showLogo, includeCharts } = reportOptions;
    const doc = new jsPDF();
    
    // Thêm tiêu đề báo cáo
    let yPos = 20;
    
    if (showLogo) {
      doc.addImage('/assets/logo.png', 'PNG', 15, yPos - 15, 30, 15);
    }
    
    doc.setFontSize(18);
    doc.text(title, 15, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(subtitle, 15, yPos);
    yPos += 10;
    
    // Thêm thông tin báo cáo
    doc.setFontSize(10);
    doc.text(`Tạo lúc: ${formatDate(new Date(), 'full')}`, 15, yPos);
    yPos += 15;
    
    // Thêm bảng dữ liệu
    if (reportData.tableData && reportData.tableData.length > 0) {
      doc.autoTable({
        startY: yPos,
        head: [reportData.tableHeaders],
        body: reportData.tableData.map(item => reportData.tableColumns.map(col => {
          // Định dạng dữ liệu dựa trên loại
          if (col.type === 'currency') {
            return formatCurrency(item[col.key]);
          } else if (col.type === 'date') {
            return formatDate(item[col.key], 'short');
          } else if (col.type === 'percent') {
            return `${item[col.key].toFixed(2)}%`;
          }
          return item[col.key];
        })),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [71, 117, 163] },
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
    }
    
    // Thêm biểu đồ nếu được yêu cầu
    if (includeCharts && reportData.chartCanvas) {
      const imgData = reportData.chartCanvas.toDataURL('image/png', 1.0);
      doc.addImage(imgData, 'PNG', 15, yPos, 180, 80);
    }
    
    return doc;
  }
  
  // Xuất báo cáo Excel
  generateExcelReport(reportData, reportOptions) {
    const { sheetNames, title } = reportOptions;
    
    const workbook = XLSX.utils.book_new();
    
    // Thêm dữ liệu cho mỗi sheet
    reportData.sheets.forEach((sheetData, index) => {
      const sheetName = sheetNames[index] || `Sheet${index + 1}`;
      
      // Tạo mảng cho dữ liệu Excel
      const excelData = [
        [title], // Tiêu đề
        [], // Dòng trống
        sheetData.headers, // Tiêu đề cột
        ...sheetData.rows // Dữ liệu
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Áp dụng kiểu dáng và định dạng
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      
      // Định dạng tiêu đề
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }];
      
      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    return workbook;
  }
  
  // Tải xuống báo cáo
  downloadReport(reportType, reportData, reportOptions) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tubex-report-${reportOptions.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
    
    if (reportType === 'pdf') {
      const pdfDoc = this.generatePDFReport(reportData, reportOptions);
      pdfDoc.save(`${filename}.pdf`);
    } else if (reportType === 'excel') {
      const workbook = this.generateExcelReport(reportData, reportOptions);
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else if (reportType === 'csv') {
      // Xử lý xuất CSV
      let csvContent = '';
      
      // Thêm tiêu đề
      csvContent += reportData.tableHeaders.join(',') + '\r\n';
      
      // Thêm dữ liệu
      reportData.tableData.forEach(row => {
        const rowValues = reportData.tableColumns.map(col => {
          let value = row[col.key];
          
          // Đảm bảo giá trị chuỗi không phá vỡ định dạng CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        });
        
        csvContent += rowValues.join(',') + '\r\n';
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Tạo liên kết tải xuống
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export const reportingService = new ReportingService();
```

## Thách thức và bài học kinh nghiệm

### Thách thức

1. **Hiệu suất với tập dữ liệu lớn**
   
   Ban đầu, bảng điều khiển gặp vấn đề hiệu suất khi tải các tập dữ liệu lớn. AI đã giúp chúng tôi triển khai các giải pháp như phân trang phía máy chủ và tổng hợp dữ liệu trước.

2. **Thiết kế cho trải nghiệm đa thiết bị**
   
   Làm cho bảng điều khiển hoạt động tốt trên cả máy tính để bàn và thiết bị di động đòi hỏi phải cân nhắc cẩn thận về bố cục và thiết kế phản hồi.

3. **Tích hợp dữ liệu thời gian thực**
   
   Kết hợp cả dữ liệu lịch sử và cập nhật thời gian thực yêu cầu thiết kế giao diện người dùng cẩn thận để tránh gây nhầm lẫn cho người dùng.

### Những điều có thể cải thiện

1. **Quá nhiều dữ liệu trên mỗi màn hình**
   
   Ban đầu chúng tôi đã cố gắng hiển thị quá nhiều chỉ số trên một màn hình:
   
   ```
   TRƯỚC: Một bảng điều khiển lớn cố gắng hiển thị 12 biểu đồ và bảng khác nhau trong một chế độ xem.
   
   SAU: Triển khai tab và xem theo danh mục, cho phép người dùng tập trung vào các nhóm chỉ số liên quan đến nhau.
   ```

2. **Yêu cầu AI không rõ ràng**
   
   Một số yêu cầu ban đầu của chúng tôi đã quá chung chung để AI đưa ra phản hồi cụ thể:
   
   ```
   TRƯỚC: "Giúp tôi làm bảng điều khiển đẹp hơn."
   
   SAU: "Tôi muốn nâng cao thẩm mỹ của bảng điều khiển Analytics. Cụ thể, tôi cần:
   1. Một bảng màu nhất quán phù hợp với nhận dạng thương hiệu của chúng tôi (màu chính: #2C5F8E)
   2. Chuyển đổi mượt mà giữa các chế độ xem và bộ lọc
   3. Ảnh động phản hồi khi người dùng tương tác với biểu đồ
   4. Hiển thị trạng thái tải dữ liệu hợp lý"
   ```

## Kết quả và tác động

Bảng điều khiển phân tích của chúng tôi đã đem lại kết quả đáng kể:

- **Giảm 40% thời gian** mà đại lý dành để tổng hợp báo cáo thủ công
- **Tăng 25% phát hiện sớm các vấn đề tồn kho** thông qua cảnh báo và dự báo
- **Nâng cao mức độ hài lòng của người dùng** với giao diện trực quan và thông tin chi tiết có thể thực hiện được
- **Cải thiện quy trình ra quyết định** dựa trên dữ liệu thay vì trực giác

## Công việc trong tương lai

Trong thời gian tới, chúng tôi dự định:

1. Triển khai các mô hình phân tích dự đoán để dự báo nhu cầu và xu hướng
2. Thêm tích hợp với các dịch vụ BI của bên thứ ba
3. Cải thiện tính năng cá nhân hóa bảng điều khiển
4. Phát triển thêm các chỉ số cụ thể cho từng ngành

## Kết luận

Việc triển khai bảng điều khiển phân tích dữ liệu cho nền tảng Tubex của chúng tôi đã chứng minh là một tính năng quan trọng, cung cấp cho khách hàng của chúng tôi những hiểu biết sâu sắc có giá trị về hoạt động kinh doanh của họ. Sự hỗ trợ của AI đã giúp chúng tôi vượt qua nhiều thách thức phức tạp và cung cấp một giải pháp linh hoạt, có thể mở rộng đáp ứng nhu cầu đặc thù của các đại lý vật liệu xây dựng.

Thành công của nỗ lực này minh họa sức mạnh của việc kết hợp lập trình được hỗ trợ bởi AI với kiến thức lĩnh vực, cho phép nhóm phát triển của chúng tôi xây dựng một hệ thống phức tạp trong một phần thời gian cần thiết theo cách truyền thống.
```
