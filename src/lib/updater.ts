import { confirm } from "@tauri-apps/plugin-dialog";
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const LAST_CHECK_KEY = "lastUpdateCheck"
const ONE_WEEK_AGO = 7 * 24 * 60 * 60;

export async function checkForUpdates(forceCheck: boolean) {
    const lastChecked = localStorage.getItem(LAST_CHECK_KEY);
    if (!forceCheck && lastChecked && Date.now() - Number(lastChecked) < ONE_WEEK_AGO) {
        return null;
    }
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString())
    const update = await isUpdateAvailable();
    if (update) {
        const confirmation = await confirm(
            "Updated version available, download and install now?",
            { title: "Update Available", kind: "warning" }
        );
        if (!confirmation) return null;
        await downloadAndInstallUpdate(update);
    } else {
        console.log("no updates found")
        return null;
    }
}

export async function isUpdateAvailable(): Promise<Update | null> {
    try {
        const update = await check()
        if (update) {
            console.log(
                `found update ${update.version} from ${update.date} with notes ${update.body}`
            );
        } else {
            console.log("no update available")
        }
        return update
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function downloadAndInstallUpdate(update: Update) {
    let downloaded = 0;
    let contentLength = 0;
    await update.downloadAndInstall((event) => {
        switch (event.event) {
            case 'Started':
                contentLength = event.data.contentLength ?? 0;
                console.log(`started downloading ${event.data.contentLength} bytes`);
                break;
            case 'Progress':
                downloaded += event.data.chunkLength;
                console.log(`downloaded ${downloaded} from ${contentLength}`);
                break;
            case 'Finished':
                console.log('download finished');
                break;
        }
    });

    console.log('Update installed');
    // Creates a confirmation Ok/Cancel dialog
    const shouldRelaunch = await confirm(
        "Update installed, restart now?",
        { title: "Relaunch", kind: "warning" }
    );

    if (shouldRelaunch) {
        relaunch();
    }
}