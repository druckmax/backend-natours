/* eslint-disable */
import { showAlert } from './alerts.js';

export const login = async (email, password) => {
  try {
    const request = await fetch('http://localhost:5000/api/v1/users/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    const res = await request.json();

    if (res.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    } else {
      console.log(res);
      throw new Error(res.message);
    }
  } catch (err) {
    console.log('test');
    showAlert('error', err.message);
  }
};

export const logout = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/v1/users/logout', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(res.message);

    window.location.reload(true);
  } catch (err) {
    showAlert('error', err.message);
  }
};
