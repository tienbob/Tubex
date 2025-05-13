import React from 'react';

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="analytics-dashboard">
      <h1>Analytics Dashboard</h1>
      
      <div className="row dashboard-summary">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Total Sales</h5>
              <h2 className="card-value">$45,678</h2>
              <p className="card-trend positive">+12.5% from last month</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Orders</h5>
              <h2 className="card-value">356</h2>
              <p className="card-trend positive">+8.2% from last month</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Customers</h5>
              <h2 className="card-value">189</h2>
              <p className="card-trend positive">+5.7% from last month</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Average Order Value</h5>
              <h2 className="card-value">$128.32</h2>
              <p className="card-trend positive">+3.8% from last month</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Sales Trends</h5>
              <div className="chart-container">
                <div className="chart-placeholder">
                  <p>Sales chart will be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Top Products</h5>
              <ul className="list-group">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Product A
                  <span className="badge bg-primary rounded-pill">124 units</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Product B
                  <span className="badge bg-primary rounded-pill">98 units</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Product C
                  <span className="badge bg-primary rounded-pill">76 units</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Product D
                  <span className="badge bg-primary rounded-pill">52 units</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Product E
                  <span className="badge bg-primary rounded-pill">41 units</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Sales by Region</h5>
              <div className="chart-container">
                <div className="chart-placeholder">
                  <p>Regional sales chart will be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Order Status</h5>
              <div className="chart-container">
                <div className="chart-placeholder">
                  <p>Order status chart will be displayed here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
