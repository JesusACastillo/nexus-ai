import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'bottom',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'bottom',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }

  async showInfo(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'primary',
      position: 'bottom',
      icon: 'information-circle-outline'
    });
    await toast.present();
  }
}
