# Wallpaper Changer

Automatically downloads and sets a random wallpaper from [dharmx/walls](https://github.com/dharmx/walls) on your Windows 10+ desktop. Wallpapers are automatically downloaded to the `download` folder inside the project directory.

## Requirements

- [Bun](https://bun.sh) (or Node.js 18+)
- Windows 10+

## Setup

1. Clone this repository:

   ```sh
   git clone https://github.com/your-username/wallpaper-changer.git
   cd wallpaper-changer
   ```

2. Install dependencies:

   ```sh
   bun add wallpaper
   ```

3. Create a file `run.vbs` in the project folder with the following content:
   ```vbscript
   Set objShell = CreateObject("WScript.Shell")
   strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
   objShell.Run "bun run """ & strPath & "\index.mjs""", 0, True
   ```

## Run manually

```sh
bun run index.mjs
```

## Schedule hourly execution on Windows 11

1. Open **Task Scheduler**.
2. Click **Create Basic Task...**
3. Name it (e.g., `Wallpaper Changer`) and click **Next**.
4. Choose **Daily**, set a start time, and click **Next**.
5. Select **Start a program** → **Next**.
6. Program: `wscript.exe`
   Arguments: `"C:\full\path\to\your\project\run.vbs"`
7. Finish the wizard.
8. In Task Scheduler Library, double-click the new task.
9. Go to the **Triggers** tab → **Edit** → check **"Repeat task every: 1 hour"** and set duration to **Indefinitely**.

The script will now run silently every hour, updating your wallpaper. Logs are saved to `wallpaper.log`.

## Acknowledgements

- Wallpaper images are sourced from [dharmx/walls](https://github.com/dharmx/walls)
- This project uses the [wallpaper](https://github.com/sindresorhus/wallpaper) library
