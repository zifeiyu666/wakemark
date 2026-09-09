/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** WakeMark URL - Production is https://wakemark.app. Use http://localhost:3000 when developing against a local site. */
  "siteUrl": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-bookmarks` command */
  export type SearchBookmarks = ExtensionPreferences & {}
  /** Preferences accessible in the `ask-ai` command */
  export type AskAi = ExtensionPreferences & {}
  /** Preferences accessible in the `sign-in` command */
  export type SignIn = ExtensionPreferences & {}
  /** Preferences accessible in the `sign-out` command */
  export type SignOut = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-bookmarks` command */
  export type SearchBookmarks = {}
  /** Arguments passed to the `ask-ai` command */
  export type AskAi = {}
  /** Arguments passed to the `sign-in` command */
  export type SignIn = {}
  /** Arguments passed to the `sign-out` command */
  export type SignOut = {}
}

