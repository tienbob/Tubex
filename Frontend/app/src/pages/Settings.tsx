import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      
      <div className="settings-section">
        <h2>Account Settings</h2>
        <form>
          <div className="mb-3">
            <label className="form-label">Email Notifications</label>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="orderNotifications" defaultChecked />
              <label className="form-check-label" htmlFor="orderNotifications">
                Order Updates
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="inventoryNotifications" defaultChecked />
              <label className="form-check-label" htmlFor="inventoryNotifications">
                Inventory Alerts
              </label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="marketingNotifications" />
              <label className="form-check-label" htmlFor="marketingNotifications">
                Marketing & Promotions
              </label>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Theme Preference</label>
            <select className="form-select" defaultValue="system">
              <option value="light">Light Theme</option>
              <option value="dark">Dark Theme</option>
              <option value="system">System Default</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Language</label>
            <select className="form-select" defaultValue="en">
              <option value="en">English</option>
              <option value="vi">Vietnamese</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary">Save Settings</button>
        </form>
      </div>
      
      <div className="settings-section mt-4">
        <h2>Company Settings</h2>
        <form>
          <div className="mb-3">
            <label htmlFor="companyName" className="form-label">Company Name</label>
            <input type="text" className="form-control" id="companyName" />
          </div>
          
          <div className="mb-3">
            <label htmlFor="companyAddress" className="form-label">Company Address</label>
            <textarea className="form-control" id="companyAddress" rows={3}></textarea>
          </div>
          
          <div className="mb-3">
            <label htmlFor="companyLogo" className="form-label">Company Logo</label>
            <input type="file" className="form-control" id="companyLogo" />
          </div>
          
          <button type="submit" className="btn btn-primary">Update Company</button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
