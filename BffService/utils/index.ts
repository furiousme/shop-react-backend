import { HttpException, HttpStatus } from "@nestjs/common";
import { AxiosError } from "axios";

export const handleFetchErrors = (error: AxiosError) => {
    console.log(error.response.data);
    throw new HttpException(error.response.data, error.response.status);
}

export const returnResponseError = (error) => {
    throw new HttpException(
        error.response?.data || 'An error occurred',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
    );
} 