import { showAlert } from './alerts.js';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const endpoint = type === 'data' ? 'updateMe' : 'updateMyPassword';

    const request = await fetch(
      `http://localhost:5000/api/v1/users/${endpoint}`,
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    const res = await request.json();
    // console.log(JSON.stringify(dt));

    if (res.status === 'success') {
      showAlert('success', `${type.toUpperCase()} successfully updated!`);
    } else {
      console.log(res);
      throw new Error(res.message);
    }
  } catch (err) {
    console.log('test');
    showAlert('error', err.message);
  }
};
