import React from 'react';

const UserProfile: React.FC = () => {
  return (
    <div className="user-profile-container">
      <h1>User Profile</h1>
      <div className="profile-content">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <form>
            <div className="mb-3">
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input type="text" className="form-control" id="fullName" placeholder="Enter your full name" />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input type="email" className="form-control" id="email" placeholder="email@example.com" readOnly />
              <div className="form-text">Email address cannot be changed.</div>
            </div>
            <div className="mb-3">
              <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
              <input type="tel" className="form-control" id="phoneNumber" placeholder="Enter your phone number" />
            </div>
            <button type="submit" className="btn btn-primary">Update Profile</button>
          </form>
        </div>
        
        <div className="profile-section mt-4">
          <h2>Change Password</h2>
          <form>
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label">Current Password</label>
              <input type="password" className="form-control" id="currentPassword" />
            </div>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label">New Password</label>
              <input type="password" className="form-control" id="newPassword" />
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
              <input type="password" className="form-control" id="confirmPassword" />
            </div>
            <button type="submit" className="btn btn-primary">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
