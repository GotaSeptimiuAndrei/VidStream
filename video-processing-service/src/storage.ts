// 1. GCS file interactions
// 2. Local file interactions
import { Storage } from '@google-cloud/storage'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'

const storage = new Storage()

const rawVideoBucketName = 'vidstream-raw-videos'
const processedVideoBucketName = 'vidstream-processed-videos'

const localRawVideoPath = './raw-videos'
const localProcessedVideoPath = './processed-videos'

/**
 * Creates the local directories for raw and processed videos
 */
export function setupDirectories() {
    ensureDirectoryExists(localRawVideoPath)
    ensureDirectoryExists(localProcessedVideoPath)
}

/**
 * @param {string} rawVideoName - The name of the raw video file from {@link localRawVideoPath}
 * @param {string} processedVideoName - The name of the processed video file from {@link localProcessedVideoPath}
 * @returns {Promise<void>} - A Promise that resolves when the video is successfully converted
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
            .outputOption('-vf', 'scale=-1:360') //360p
            .on('end', () => {
                console.log('Video processing finished successfully')
                resolve()
            })
            .on('error', (err) => {
                console.log('An error occurred: ' + err.message)
                reject(err)
            })
            .save(`${localProcessedVideoPath}/${processedVideoName}`)
    })
}

/**
 * @param {string} filenName - The name of the file to download from the {@link rawVideoBucketName} bucket
 * into the {@link localRawVideoPath} folder.
 * @returns {Promise<void>} - A Promise that resolves when the file is successfully downloaded
 */
export async function downloadRawVideo(fileName: string) {
    await storage
        .bucket(rawVideoBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoPath}/${fileName}` })

    console.log(
        'gs://',
        rawVideoBucketName,
        '/',
        fileName,
        ' downloaded to ',
        localRawVideoPath
    )
}

/*
 * @param {string} fileName - The name of the file to upload from the {@link localProcessedVideoPath} folder
 * into the {@link processedVideoBucketName} bucket.
 * @returns {Promise<void>} - A Promise that resolves when the file is successfully uploaded
 */
export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName)

    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName,
    })

    console.log(
        `${localProcessedVideoPath}/${fileName}`,
        ' uploaded to gs://',
        processedVideoBucketName,
        '/',
        fileName
    )

    await bucket.file(fileName).makePublic()
}

/**
 * @param {string} fileName - The name of the file to delete from the {@link localRawVideoPath} folder
 * @returns {Promise<void>} - A Promise that resolves when the file is successfully deleted
 */
export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`)
}

/**
 * @param {string} fileName - The name of the file to delete from the {@link localProcessedVideoPath} folder
 * @returns {Promise<void>} - A Promise that resolves when the file is successfully deleted
 */
export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`)
}

/**
 * @param filePath - The path to the file to be deleted
 * @returns {Promise<void>} - A Promise that resolves when the file is successfully deleted
 */
function deleteFile(filePath: string) {
    return new Promise<void>((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file ${filePath}`, err)
                    reject(err)
                } else {
                    console.log(`File deleted at ${filePath}`)
                    resolve()
                }
            })
        } else {
            console.log(`File not found at ${filePath}, skipping deletion`)
            resolve()
        }
    })
}

/**
 * Ensures a directory exists, creating it if it does not
 * @param {string} dirPath - The directory path to check
 */
function ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }) // recursive: true creates parent directories if they do not exist
        console.log(`Directory created at ${dirPath}`)
    }
}
