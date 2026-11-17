import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

export function FlashlightScreen() {
  const [permission, requestCameraPermission, getCameraPermission] = useCameraPermissions();
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState !== 'background' && AppState.currentState !== 'inactive'
  );
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTorchRequestedOn, setIsTorchRequestedOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cameraInstance, setCameraInstance] = useState(0);
  const isScreenFocused = useIsFocused();

  const shouldMountCamera =
    permission?.granted === true &&
    isAppActive &&
    isScreenFocused &&
    cameraError === null;
  const canControlTorch = shouldMountCamera && isCameraReady;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const appIsActive = nextState === 'active';
      setIsAppActive(appIsActive);
      setIsCameraReady(false);

      if (!appIsActive) {
        setIsTorchRequestedOn(false);
        setCameraError(null);
        return;
      }

      void getCameraPermission()
        .then((result) => {
          if (result.granted) {
            setActionError(null);
          }
        })
        .catch((error: unknown) => {
          setActionError(`Unable to refresh camera permission: ${getErrorMessage(error)}`);
        });
    });

    return () => subscription.remove();
  }, [getCameraPermission]);

  useEffect(() => {
    if (!isScreenFocused) {
      setIsCameraReady(false);
      setIsTorchRequestedOn(false);
      setCameraError(null);
    }
  }, [isScreenFocused]);

  useEffect(() => {
    if (!shouldMountCamera) {
      setIsCameraReady(false);
      setIsTorchRequestedOn(false);
    }
  }, [shouldMountCamera]);

  const handleRequestPermission = async () => {
    setActionError(null);

    try {
      const result = await requestCameraPermission();
      if (!result.granted && !result.canAskAgain) {
        setActionError('Camera access is blocked. Open app settings to allow camera access.');
      } else if (!result.granted) {
        setActionError('Camera permission was not granted.');
      }
    } catch (error: unknown) {
      setActionError(`Unable to request camera permission: ${getErrorMessage(error)}`);
    }
  };

  const handleOpenSettings = async () => {
    setActionError(null);

    try {
      await Linking.openSettings();
    } catch (error: unknown) {
      setActionError(`Unable to open app settings: ${getErrorMessage(error)}`);
    }
  };

  const handleToggleTorch = () => {
    if (!canControlTorch) {
      return;
    }

    setIsTorchRequestedOn((requestedOn) => !requestedOn);
  };

  const handleCameraMountError = (event: { message: string }) => {
    setIsCameraReady(false);
    setIsTorchRequestedOn(false);
    setCameraError(event.message);
  };

  const handleRetryCamera = () => {
    setActionError(null);
    setCameraError(null);
    setIsCameraReady(false);
    setIsTorchRequestedOn(false);
    setCameraInstance((instance) => instance + 1);
  };

  const status = getStatus({
    permissionGranted: permission?.granted === true,
    isPermissionPending: permission === null,
    isAppActive,
    isScreenFocused,
    isCameraReady: canControlTorch,
    isTorchRequestedOn,
    cameraError,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ALFRED</Text>
      <Text style={styles.subtitle}>Flashlight prototype</Text>

      <View style={styles.preview}>
        {shouldMountCamera && (
          <CameraView
            key={cameraInstance}
            style={styles.camera}
            facing="back"
            enableTorch={canControlTorch && isTorchRequestedOn}
            onCameraReady={() => {
              setIsCameraReady(true);
              setCameraError(null);
            }}
            onMountError={handleCameraMountError}
          />
        )}

        {!permission?.granted && (
          <Text style={styles.previewMessage}>
            {permission === null
              ? 'Checking camera permission...'
              : 'Camera access is needed to control the flashlight.'}
          </Text>
        )}

        {permission?.granted && !isAppActive && (
          <Text style={styles.previewMessage}>Camera paused while Alfred is in the background.</Text>
        )}

        {permission?.granted && isAppActive && !isScreenFocused && (
          <Text style={styles.previewMessage}>Camera paused while this screen is inactive.</Text>
        )}

        {shouldMountCamera && !isCameraReady && (
          <Text style={styles.previewMessage}>Starting rear camera...</Text>
        )}

        {cameraError !== null && (
          <View style={styles.previewMessageContainer}>
            <Text style={styles.previewError}>Camera could not start: {cameraError}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleRetryCamera}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
              <Text style={styles.secondaryButtonText}>Retry camera</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {status}
      </Text>

      {permission?.granted && canControlTorch && (
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{
            checked: isTorchRequestedOn,
            disabled: !canControlTorch,
          }}
          disabled={!canControlTorch}
          onPress={handleToggleTorch}
          style={({ pressed }) => [
            styles.torchButton,
            isTorchRequestedOn && styles.torchButtonOn,
            pressed && styles.pressed,
            !canControlTorch && styles.disabledButton,
          ]}>
          <Text style={styles.torchButtonText}>
            {isTorchRequestedOn ? 'Turn flashlight off' : 'Turn flashlight on'}
          </Text>
        </Pressable>
      )}

      {permission !== null && !permission.granted && permission.canAskAgain && (
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleRequestPermission()}
          style={({ pressed }) => [styles.torchButton, pressed && styles.pressed]}>
          <Text style={styles.torchButtonText}>Allow camera access</Text>
        </Pressable>
      )}

      {permission !== null && !permission.granted && !permission.canAskAgain && (
        <View style={styles.permissionActions}>
          <Text style={styles.permissionMessage}>
            Allow camera access in app settings, then return to Alfred.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleOpenSettings()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>Open app settings</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleRequestPermission()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>Check permission again</Text>
          </Pressable>
        </View>
      )}

      {actionError !== null && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {actionError}
        </Text>
      )}
    </View>
  );
}

function getStatus({
  permissionGranted,
  isPermissionPending,
  isAppActive,
  isScreenFocused,
  isCameraReady,
  isTorchRequestedOn,
  cameraError,
}: {
  permissionGranted: boolean;
  isPermissionPending: boolean;
  isAppActive: boolean;
  isScreenFocused: boolean;
  isCameraReady: boolean;
  isTorchRequestedOn: boolean;
  cameraError: string | null;
}) {
  if (isPermissionPending) {
    return 'Checking camera permission...';
  }
  if (!permissionGranted) {
    return 'Camera permission required';
  }
  if (!isAppActive) {
    return 'Flashlight paused in background';
  }
  if (!isScreenFocused) {
    return 'Flashlight paused while screen is inactive';
  }
  if (cameraError !== null) {
    return 'Camera unavailable';
  }
  if (!isCameraReady) {
    return 'Starting camera...';
  }

  return isTorchRequestedOn ? 'Flashlight on' : 'Flashlight off';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080D18',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#38BDF8',
    fontSize: 38,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 12,
  },
  preview: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 4 / 3,
    marginTop: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#111827',
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  previewMessage: {
    color: '#CBD5E1',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  previewMessageContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  previewError: {
    color: '#FCA5A5',
    textAlign: 'center',
  },
  torchButton: {
    minWidth: 220,
    marginTop: 28,
    alignItems: 'center',
    backgroundColor: '#0E7490',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  torchButtonOn: {
    backgroundColor: '#155E75',
  },
  torchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  secondaryButton: {
    minWidth: 180,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  secondaryButtonText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  permissionActions: {
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  permissionMessage: {
    color: '#CBD5E1',
    textAlign: 'center',
  },
  status: {
    color: '#94A3B8',
    marginTop: 20,
    textAlign: 'center',
  },
  error: {
    color: '#FCA5A5',
    marginTop: 12,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
