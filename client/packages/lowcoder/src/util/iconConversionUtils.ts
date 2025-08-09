import { parseIconIdentifier } from 'comps/comps/multiIconDisplay'

/**
 * Utility functions for handling app-specific favicon and icon conversion
 */

export interface AppIconInfo {
    type: 'antd' | 'fontAwesome' | 'base64' | 'url' | 'unknown'
    identifier: string
    name?: string
    url?: string
    data?: string
}

/**
 * Extract app icon information from app settings
 */
export function getAppIconInfo(appSettingsComp: any): AppIconInfo | null {
    if (!appSettingsComp?.children?.icon?.getView) {
        return null
    }

    const iconIdentifier = appSettingsComp.children.icon.getView()

    if (!iconIdentifier) {
        return null
    }

    // If the identifier is an object, try to extract the string value
    let iconString = iconIdentifier
    if (typeof iconIdentifier === 'object') {
        // Check if it's a React element
        if (iconIdentifier.$$typeof === Symbol.for('react.element')) {
            // Try to extract icon information from React element props
            if (iconIdentifier.props && iconIdentifier.props.value) {
                // For URL-based icons, the value contains the URL
                iconString = iconIdentifier.props.value
            } else if (iconIdentifier.props && iconIdentifier.props.icon) {
                iconString = iconIdentifier.props.icon
            } else if (iconIdentifier.props && iconIdentifier.props.type) {
                // For Ant Design icons, the type might be in props.type
                iconString = iconIdentifier.props.type
            } else {
                return null
            }
        } else {
            // Try to get the string value from the object
            if (iconIdentifier.value !== undefined) {
                iconString = iconIdentifier.value
            } else if (iconIdentifier.toString) {
                iconString = iconIdentifier.toString()
            } else {
                return null
            }
        }
    }

    const parsed = parseIconIdentifier(iconString)

    return {
        type: parsed.type as AppIconInfo['type'],
        identifier: iconString,
        name: parsed.name,
        url: parsed.url,
        data: parsed.data,
    }
}

/**
 * Generate favicon URL for an app
 * This is a simple implementation that returns the icon as-is for now
 * In Phase 2, this will be replaced with actual icon conversion logic
 */
export function getAppFaviconUrl(appId: string, iconInfo: AppIconInfo): string {
    // Use backend PNG conversion endpoint for consistent, cacheable favicons
    // The backend handles data URLs/HTTP images and falls back gracefully
    return `/api/applications/${appId}/icons/192.png`
}

/**
 * Check if an icon can be used as a favicon
 */
export function canUseAsFavicon(iconInfo: AppIconInfo): boolean {
    switch (iconInfo.type) {
        case 'url':
        case 'base64':
            return true
        case 'antd':
        case 'fontAwesome':
            // These need conversion to be used as favicon
            return false
        default:
            return false
    }
}

/**
 * Get the appropriate favicon for an app
 * Returns the app-specific favicon if available, otherwise null
 */
export function getAppFavicon(
    appSettingsComp: any,
    appId: string
): string | null {
    const iconInfo = getAppIconInfo(appSettingsComp)

    if (!iconInfo) {
        return null
    }

    // Always prefer the backend-rendered PNG for a reliable favicon
    return getAppFaviconUrl(appId, iconInfo)
}

/**
 * Build the backend PNG icon URL for a given size and optional background color.
 * Pass backgroundHex with or without leading '#'.
 */
export function getAppIconPngUrl(
    appId: string,
    size: number,
    backgroundHex?: string
): string {
    const base = `/api/applications/${appId}/icons/${size}.png`
    if (!backgroundHex) return base
    const clean = backgroundHex.startsWith('#')
        ? backgroundHex
        : `#${backgroundHex}`
    const bg = encodeURIComponent(clean)
    return `${base}?bg=${bg}`
}

/**
 * Convenience URL for share previews (Open Graph / Twitter), using 512 size.
 */
export function getOgImageUrl(appId: string, backgroundHex?: string): string {
    return getAppIconPngUrl(appId, 512, backgroundHex)
}
