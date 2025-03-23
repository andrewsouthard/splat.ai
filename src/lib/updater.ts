import { confirm } from "@tauri-apps/plugin-dialog";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export async function checkForUpdates() {
    const update = await check();
    if (update) {
        console.log(
            `found update ${update.version} from ${update.date} with notes ${update.body}`
        );
        const confirmation = await confirm(
            "Updated version available, download and install now?",
            { title: "Update Available", kind: "warning" }
        );
        if (!confirmation) return;

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
    } else {
        console.log("no updates found")
    }
}