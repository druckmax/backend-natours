/* eslint-disable */
import { showAlert } from './alerts.js';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const endpoint = type === 'data' ? 'updateMe' : 'updateMyPassword';

    let options = { method: 'PATCH' };

    if (type === 'data') {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('photo', data.photo);

      options.body = formData;
    } else {
      options.headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      options.body = JSON.stringify(data);
    }

    const request = await fetch(
      `http://localhost:5000/api/v1/users/${endpoint}`,
      options
    );
    const res = await request.json();
    // console.log(JSON.stringify(dt));

    if (res.status === 'success') {
      showAlert('success', `${type.toUpperCase()} successfully updated!`);
    } else {
      // console.log(res);
      throw new Error(res.message);
    }
  } catch (err) {
    showAlert('error', err.message);
  }
};
