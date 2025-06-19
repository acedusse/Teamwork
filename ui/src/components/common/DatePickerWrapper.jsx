import React from 'react';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * DatePicker component wrapper
 * This wrapper ensures the DatePicker is properly configured with LocalizationProvider
 * and helps prevent import errors by providing a centralized import location
 */
const DatePicker = (props) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDatePicker {...props} />
    </LocalizationProvider>
  );
};

export default DatePicker;
